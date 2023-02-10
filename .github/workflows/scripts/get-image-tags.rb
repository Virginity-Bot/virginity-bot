#!/usr/bin/env ruby

require 'json'
require_relative 'lib'

def main
  puts get_image_tags(
         git_repo: ARGV[0],
         git_ref_name: ARGV[1],
         git_ref_type: ARGV[2],
         git_default_branch: ARGV[3],
         package: JSON.parse(File.read('package.json')),
       ).join(',')
end

main()
