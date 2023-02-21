require 'test/unit'
require 'json'

require_relative '../lib'

class TestGetImageTags < Test::Unit::TestCase
  def test_get_image_tags
    assert_equal(
      ['ghcr.io/virginity-bot/virginity-bot/bot:feat-foo-bar'],
      get_image_tags(
        git_repo: 'Virginity-Bot/virginity-bot',
        git_ref_name: 'feat/foo-bar',
        git_ref_type: 'branch',
        git_default_branch: 'master',
        package: JSON.parse('{"version": "1.0.0"}'),
      ),
    )

    assert_equal(
      %w[
        ghcr.io/virginity-bot/virginity.bot/bot:1.0.0
        ghcr.io/virginity-bot/virginity.bot/bot:latest
        ghcr.io/virginity-bot/virginity.bot/bot:master
      ],
      get_image_tags(
        git_repo: 'Virginity-Bot/virginity.bot',
        git_ref_name: 'master',
        git_ref_type: 'branch',
        git_default_branch: 'master',
        package: JSON.parse('{"version": "1.0.0"}'),
      ),
    )

    assert_equal(
      ['ghcr.io/virginity-bot/virginity.bot/bot:feat-foo-bar'],
      get_image_tags(
        git_repo: 'Virginity-Bot/virginity.bot',
        git_ref_name: 'feat/Foo---bar',
        git_ref_type: 'branch',
        git_default_branch: 'master',
        package: JSON.parse('{"version": "1.0.0"}'),
      ),
    )

    assert_equal(
      %w[
        ghcr.io/virginity-bot/virginity.bot/bot:1.0.0
        ghcr.io/virginity-bot/virginity.bot/bot:latest
      ],
      get_image_tags(
        git_repo: 'Virginity-Bot/virginity.bot',
        git_ref_name: '1.0.0',
        git_ref_type: 'tag',
        git_default_branch: 'master',
        package: JSON.parse('{"version": "1.0.0"}'),
      ),
    )
  end
end
