const FormData = require('form-data')
const fs = require('fs-extra')
const path = require('path')
const util = require('util')
const AdmZip = require('adm-zip')
const os = require('os')
const arch = require('arch')
const si = require('systeminformation')
const dirTree = require('directory-tree')
const isDev = require('./isdev')

const DistroManager = require('./distromanager')
const ConfigManager = require('./configmanager')

const SUPPORT_URI = 'https://www.northernblade.ru/api/submit/support/request'


async function gatherSystemInfo(account, versionId, launcherVersion = 'unnecessary') {
    return {
        'accountid': account.uuid,
        'launcher': launcherVersion,
        'fingerprint': ConfigManager.getFingerprint(),
        'version': versionId,
        'cpumodel': os.cpus()[0].model,
        'ostype': `${os.platform()};${os.arch()};${arch()}`,
        'osversion': os.release(),
        'ramsize': Math.round(os.totalmem() / 1024 / 1024 / 1024) + 'GB',
        'gpu': (await si.graphics()).controllers[0].model
    }
}


function addIfAccess(zip, filePath) {
    return fs.promises.access(filePath)
        .then(() => {
            zip.addLocalFile(filePath)
        })
        .catch(() => {
            console.warn(`Failed to add ${filePath} into report archive`)
        })
}


async function sendReport(filesList, archivePrefix, metaSubsection, metaDescription, launcherVersion) {
    const account = ConfigManager.getSelectedAccount()
    const versionId = DistroManager.getDistribution().getServer(ConfigManager.getSelectedServer()).getVersion()

    if (filesList.length === 0) {
        console.log('Report was not sent - empty files list')
        return
    }

    const dumpForm = new FormData({})

    dumpForm.append('meta', JSON.stringify({
        'username': account.username,
        'section': 'internal',
        'subsection': metaSubsection,
        'description': metaDescription,
    }), {contentType: 'application/json; charset=utf-8'})

    let zip = new AdmZip()
    for (let i = 0; i < filesList.length; i++) {
        await addIfAccess(zip, filesList[i])
    }

    const sysinfo = await gatherSystemInfo(account, versionId, launcherVersion)
    zip.addFile('sysinfo.json', JSON.stringify(sysinfo))

    dumpForm.append(archivePrefix, zip.toBuffer(), {filename: `${archivePrefix}-${account.username}.zip`})

    const res = await util.promisify(dumpForm.submit).bind(dumpForm)(SUPPORT_URI)
    if (res.statusCode !== 204) {
        console.warn(`Failed to send report: ${res.statusMessage}`)
    }
    const unlinkResults = []
    for (let i = 0; i < filesList.length; i++) {
        unlinkResults.push(fs.unlink(filesList[i]))
    }
    await Promise.allSettled(unlinkResults)
    console.log('Report was sent successfully!')
}


function flatten(tree) {
    if (tree.length !== 0) {
        const children = tree.children
        const files = []
        for (let i = 0; i < children.length; i++) {
            files.push(children[i].path)
        }
        return files
    }
    return []
}

class DumpsReporter {
    static async report(applicationVersion) {
        if (isDev) {
            return
        }
        const filesList = flatten(dirTree(path.join(ConfigManager.getApplicationDirectory(), applicationVersion, 'bin'), {extensions: /\.dmp/}))
        return await sendReport(filesList, 'dumps', 'crash', '[crush_dumps]')
    }
}


class LogsReporter {
    static async report(launcherVersion) {
        if (isDev) {
            return
        }
        const launcherDirectory = ConfigManager.getLauncherDirectory()
        const filesList = flatten(dirTree(path.join(launcherDirectory, 'logs'), {extensions: /\.log/}))
        return await sendReport(filesList, 'logs', 'launching', '[error_during_launch]', launcherVersion)
    }
    static async truncateLogs() {
        const launcherDirectory = ConfigManager.getLauncherDirectory()
        const filesList = flatten(dirTree(path.join(launcherDirectory, 'logs'), {extensions: /\.log/}))
        for (let i = 0; i < filesList.length; i++) {
            await fs.promises.truncate(filesList[i], 0)
        }
    }
}


module.exports = {
    DumpsReporter,
    LogsReporter,
}
