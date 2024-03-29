#!/usr/bin/env ruby

require 'json'

# @param sender_type [String] One of "User", ???
# @param organization [String] The name of the GH org.
# @param action [String] One of "opened", "labeled", "unlabeled"
# @param issue_id [String] The modified issue's ID.
#
#   @example "I_kwDOG9mg085eMlGZ"
# @param label [String] The name of the modified label.
#
#   This is only set when `action` is "labeled" or "unlabeled"
def main(
  sender_type: nil,
  organization: nil,
  action: nil,
  issue_id: nil,
  label: nil
)
  puts `gh auth status`

  # check that a human caused this event
  exit 0 if sender_type != 'User'

  # The label that was changed was not a "priority" label
  exit 0 if !label.match /^p\d$/

  project =
    JSON
      .parse(
        `gh api graphql -f query='
          query GetProjectPriorityField($org: String!) {
            organization(login: $org) {
              projectsV2(first: 1) {
                nodes { id }
              }
            }
          }' \
          -f org="#{organization}"`,
        object_class: OpenStruct,
      )
      .data
      .organization
      .projectsV2
      .nodes[
      0
    ]
  puts project.id

  priority_field =
    JSON
      .parse(
        `gh api graphql -f query='
          query GetProjectPriorityField($project_id: ID!) {
            node(id: $project_id) {
              ... on ProjectV2 {
                field(name: "Priority") {
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options { id, name }
                  }
                }
              }
            }
          }' \
          -f project_id="#{project.id}"`,
        object_class: OpenStruct,
      )
      .data
      .node
      .field
  puts priority_field.id

  # find the value that matches our desired priority
  value_nameish =
    case label
    when 'p0'
      'Urgent'
    when 'p1'
      'High'
    when 'p2'
      'Medium'
    when 'p3'
      'Low'
    else
      puts "Bad label '#{label}'"
      exit 1
    end
  puts value_nameish
  target_field_value =
    priority_field.options.find { |f| f.name.match(value_nameish) }.id
  puts target_field_value

  # get the item id
  items =
    JSON
      .parse(
        `gh api graphql -f query='
          query GetProjectItem($issue_id: ID!) {
            node(id: $issue_id) {
              ... on Issue {
                projectItems(first: 10) {
                  nodes { id }
                }
              }
            }
          }' \
          -f issue_id="#{issue_id}"`,
        object_class: OpenStruct,
      )
      .data
      .node
      .projectItems
      .nodes
  puts items.map { |it| it.id }

  for item in items
    case
    when 'labeled'
      `gh api graphql -f query='
        mutation SetPriority(
          $project_id: ID!, $item_id: ID!, $field_id: ID!, $field_value: String!
        ) {
          updateProjectV2ItemFieldValue(
            input: {
              projectId: $project_id
              itemId: $item_id
              fieldId: $field_id
              value: { singleSelectOptionId: $field_value }
            }
          ) { projectV2Item { id } }
        }' \
        -f project_id="#{project.id}" \
        -f item_id="#{item.id}" \
        -f field_id="#{priority_field.id}" \
        -f field_value="#{target_field_value}"`
    when 'unlabeled'
      `gh api graphql -f query='
        mutation UnsetPriority(
          $projectId: ID!
          $itemId: ID!
          $fieldId: ID!
        ) {
          clearProjectV2ItemFieldValue(
            input: {
              projectId: $projectId
              itemId: $itemId
              fieldId: $fieldId
            }
          ) {
            projectV2Item {
              id
            }
          }
        }' \
        -f project_id="#{project.id}" \
        -f item_id="#{item.id}" \
        -f field_id="#{priority_field.id}"`
    when 'opened'
      puts 'Skipping upon creation'
    end
  end
end

main(
  sender_type: ARGV[0],
  organization: ARGV[1],
  action: ARGV[2],
  issue_id: ARGV[3],
  label: ARGV[4],
)
