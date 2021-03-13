# `#core/`

This is the core Serenity framework, an extremely flexible and powerful framework for Discord bots.
Though it's not currently easily usable in other projects, I hope to polish it up and release it someday.

# Acknowledgements

Serenity's framework is heavily inspired by the following projects:

- [`discord-akairo`](https://github.com/discord-akairo/discord-akairo) by [1Computer1](https://github.com/1Computer1)
- [`@sapphire/framework`](https://github.com/sapphire-project/framework) by the Sapphire Project contributors

Internally, the Serenity framework uses a parser/lexer quite similar to [Lexure](https://github.com/1Computer1/lexure), also by [1Computer1](https://github.com/1Computer1). The main reason we rolled my own version of this was for learning purposes; there's also some small semantic changes here and there (such as parsing escaped quotes in the lexer).

See the [third party licenses file](./THIRD-PARTY-LICENSES.md) for more details.
