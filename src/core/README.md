# `#core`

This is the core Serenity framework, an extremely flexible and powerful framework for Discord bots.
Though it's not currently easily usable in other projects, I hope to polish it up and release it someday.

# Acknowledgements

Serenity's framework is heavily inspired by the following projects:

- [`discord-akairo`](https://github.com/discord-akairo/discord-akairo) by [1Computer1](https://github.com/1Computer1)
- [`@sapphire/framework`](https://github.com/sapphire-project/framework) by the Sapphire Project contributors

Internally, the Serenity framework uses a parser/lexer quite similar to [Lexure](https://github.com/1Computer1/lexure), also by [1Computer1](https://github.com/1Computer1). The only reason I rolled my own version of this was that I mainly wanted to learn how something like this would've been written. There's also some small semantic changes here and there (such as allowing escaped quotes in the lexer).

Copyright notices are included in individual files where inspiration was taken from one of the above projects.
