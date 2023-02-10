#!/usr/bin/env ruby

require 'json'
require_relative 'lib'

def main
  puts get_image_tags(
         ARGV[1],
         ARGV[2],
         ARGV[3],
         ARGV[4],
         JSON.parse(File.read('package.json')),
       ).join(',')
end

main()
