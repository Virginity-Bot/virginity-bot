# @param git_repo [String]
# @param git_ref_name [String]
# @param git_ref_type [String]
# @param git_default_branch [String]
# @return [String[]]
def get_image_tags(
  git_repo: nil,
  git_ref_name: nil,
  git_ref_type: nil,
  git_default_branch: nil,
  package: nil
)
  container_repo = "ghcr.io/#{git_repo.downcase}"
  versions = [git_ref_name.downcase.gsub(/[^a-z0-9._\n]+/, '-')]

  if git_ref_name == git_default_branch
    # add version tag
    versions.push(package['version'])
  end

  if git_ref_name == git_default_branch or git_ref_type == 'tag'
    # Use Docker `latest` tag convention, only tagging `latest` on default branch.
    versions.push('latest')
  end

  puts versions.join(',')

  return versions.map { |v| "#{container_repo}/bot:#{v}" }.sort()
end
