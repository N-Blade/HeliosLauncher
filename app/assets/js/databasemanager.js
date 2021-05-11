const path = require('path')
const isDev = require('./isdev')
const Database = require('better-sqlite3')

const sysRoot = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME)
const dbPath = path.join(sysRoot, '.nblade', 'bladelauncher.db')
const db = isDev ? new Database(dbPath, {verbose: console.log}) : new Database(dbPath)


class DatabaseManager {
    static getDescriptor(type, id, channel) {
        return db.prepare(`SELECT json FROM ${type} WHERE id = ? AND channel = ?`)
            .get(JSON.stringify(id), JSON.stringify(channel))
    }

    static putDescriptor(descriptorType, channel, descriptor) {
        db.prepare(`CREATE TABLE IF NOT EXISTS ${descriptorType} (id TEXT NOT NULL UNIQUE, channel TEXT NOT NULL, json TEXT NOT NULL)`).run()
        db.prepare(`INSERT OR IGNORE INTO ${descriptorType} (id, channel, json) VALUES (?, ?, ?)`)
            .run(
                JSON.stringify(descriptor.id),
                JSON.stringify(channel),
                JSON.stringify(descriptor)
            )
    }

    static getAllVersions(channel = 'release') {  //remove later
        return db.prepare('SELECT json FROM assets WHERE channel = ?')
            .all(JSON.stringify(channel))
    }

    static getVersion(versionId, channel) {  //remove later
        return db.prepare('SELECT json FROM assets WHERE id = ? AND channel = ?')
            .get(JSON.stringify(versionId), JSON.stringify(channel))
    }

    static saveConfig(config) {
        db.prepare('INSERT OR REPLACE INTO config (id, json) VALUES (?, ?)')
            .run(
                1,
                JSON.stringify(config),
            )
    }

    static getConfig() {
        db.prepare('CREATE TABLE IF NOT EXISTS config (id INTEGER NOT NULL UNIQUE, json TEXT NOT NULL)').run()
        return db.prepare('SELECT json FROM config').get()
    }

    static addTorrent(targetPath, torrentFile) {
        db.prepare('CREATE TABLE IF NOT EXISTS torrents (path TEXT NOT NULL UNIQUE, torrentdata TEXT NOT NULL UNIQUE)').run()
        db.prepare('INSERT OR IGNORE INTO torrents (path, torrentdata) VALUES (?, ?)')
            .run(
                JSON.stringify(targetPath),
                torrentFile.toString('base64')
            )
    }

    static getAllTorrents() {
        return db.prepare('SELECT * FROM torrents').all()
    }

}


module.exports = {
    DatabaseManager
}

