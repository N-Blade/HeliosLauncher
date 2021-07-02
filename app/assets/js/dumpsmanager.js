const fs = require('fs-extra')
const LoggerUtil = require('./loggerutil')
const logger = LoggerUtil('%c[DumpsManager]', 'color: #a02d2a; font-weight: bold')
const ConfigManager = require('./configmanager')

exports.createRules = async function (binaryName) {
    const reg = require('native-reg')
    const dumpsDirectory = ConfigManager.getCrashDumpDirectory()
    await fs.promises.mkdir(dumpsDirectory, {recursive: true})

    return new Promise((resolve, reject) => {
        let regKeyDumps = reg.openKey(reg.HKCU, `SOFTWARE\\Microsoft\\Windows\\Windows Error Reporting\\LocalDumps\\${binaryName}`, reg.Access.ALL_ACCESS)
        if (regKeyDumps === null) {
            logger.warn('Dumps registry key doesn\'t exist, creating...')
            regKeyDumps = reg.createKey(reg.HKCU, `SOFTWARE\\Microsoft\\Windows\\Windows Error Reporting\\LocalDumps\\${binaryName}`, reg.Access.ALL_ACCESS)
            reg.setValueDWORD(regKeyDumps, 'DumpCount', '3')
            reg.setValueDWORD(regKeyDumps, 'DumpType', '1')
            reg.setValueEXPAND_SZ(regKeyDumps, 'DumpFolder', dumpsDirectory)
        } else if (reg.getValue(regKeyDumps, '', 'DumpFolder') !== dumpsDirectory) {
            logger.warn('Wrong dumps directory, fixing...')
            reg.setValueEXPAND_SZ(regKeyDumps, 'DumpFolder', dumpsDirectory)
        }
        reg.closeKey(regKeyDumps)
        resolve()
    })
}