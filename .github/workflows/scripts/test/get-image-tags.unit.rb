require 'test/unit'

require_relative '../lib'

class TestGetImageTags < Test::Unit::TestCase
  def test_get_image_tags
    assert_equal(
      ['ghcr.io/virginity-bot/virginity.bot/bot:feat-foo-bar'],
      get_image_tags(
        'Virginity-Bot/virginity.bot',
        'feat/foo-bar',
        'branch',
        'master',
        { version: '1.0.0' },
      ),
    )

    assert_equal(
      %w[
        ghcr.io/virginity-bot/virginity.bot/bot:1.0.0
        ghcr.io/virginity-bot/virginity.bot/bot:latest
        ghcr.io/virginity-bot/virginity.bot/bot:master
      ],
      get_image_tags(
        'Virginity-Bot/virginity.bot',
        'master',
        'branch',
        'master',
        { version: '1.0.0' },
      ),
    )

    assert_equal(
      ['ghcr.io/virginity-bot/virginity.bot/bot:feat-foo-bar'],
      get_image_tags(
        'Virginity-Bot/virginity.bot',
        'feat/Foo---bar',
        'branch',
        'master',
        { version: '1.0.0' },
      ),
    )

    assert_equal(
      %w[
        ghcr.io/virginity-bot/virginity.bot/bot:1.0.0
        ghcr.io/virginity-bot/virginity.bot/bot:latest
      ],
      get_image_tags(
        'Virginity-Bot/virginity.bot',
        '1.0.0',
        'tag',
        'master',
        { version: '1.0.0' },
      ),
    )
  end
end
