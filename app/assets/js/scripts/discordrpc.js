// Validation Regexes.
const validNickname = /^[а-яА-Я_]{1,10}$/
//const validGuild = /^[а-яА-Яa-zA-z_]{1,17}$/

const nicknameDiscordRPC = document.getElementById('nicknameDiscordRPC')
const guildDiscordRPC = document.getElementById('guildDiscordRPC')
const discordRPCButton = document.getElementById('discordRPCButton')
const discordRPCForm = document.getElementById('discordRPCForm')

const isValid = (value, regex) => {
    if (regex.test(value)) {
        return true
    } else {
        console.log(`Error value: "${value}" isn't valid`)
    }
}

// Disable default form behavior.
discordRPCForm.onsubmit = () => { return false }

// Bind discord rpc button behavior.
discordRPCButton.addEventListener('click', () => {
    const current = ConfigManager.getSelectedAccount()
    if (isValid(nicknameDiscordRPC.value, validNickname)) {
        ConfigManager.updateDiscordNickname(current.uuid, nicknameDiscordRPC.value)
    }
    ConfigManager.updateDiscordGuild(current.uuid, guildDiscordRPC.value)
    ConfigManager.save()
})


