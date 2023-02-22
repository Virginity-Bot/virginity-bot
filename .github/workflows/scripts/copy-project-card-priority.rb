#!/usr/bin/env ruby

require 'json'

def main
  item_id = ARGV[0]

  # check that a human caused this event

  # get priority from project card
  item_obj =
    JSON.parse(
      `gh api graphql -f query='
        query GetProjectItem($item_id: ID!) {
          node(id: $item_id) {
            ... on ProjectV2Item {
              id
              content {
                ... on Issue {
                  id
                  number
                }
              }
              fieldValueByName(name: "Priority") {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  id
                  optionId
                  field {
                    ... on ProjectV2SingleSelectField {
                      options {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
        ' \
        -f item_id="#{item_id}"`,
      object_class: OpenStruct,
    )

  issue_number = item_obj.data.node.content.number
  puts issue_number

  exit 0 if issue_number == nil

  f = item_obj.data.node.fieldValueByName
  label_priority = f.field.options.find { |o| o.id == f.optionId }.name
  puts label_priority

  # select the label name that matches our desired priority
  target_label_name =
    case label_priority
    when /.*Urgent.*/
      'p0'
    when /.*High.*/
      'p1'
    when /.*Medium.*/
      'p2'
    when /.*Low.*/
      'p3'
    when nil
      nil
    else
      puts "Bad label '#{label_priority}'"
      exit 1
    end
  puts target_label_name

  # remove pre-existing priority labels
  `gh issue edit "#{issue_number}" #{
    [].fill(0, 4) { |i| "p#{i}" }
      .filter { |l| l != target_label_name }
      .map { |l| "--remove-label #{l}" }
      .join(' ')
  }`

  # add priority label
  if target_label_name != nil
    `gh issue edit "#{issue_number}" --add-label "#{target_label_name}"`
  end
end

main()
