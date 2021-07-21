const EventEmitter = require('events')
const fs = require('fs-extra')
const util = require('util')
const execFile = util.promisify(require('child_process').execFile)
const crypto = require('crypto')
const arch = require('arch')
const isDev = require('./isdev')
const path = require('path')

class TimeoutEmitter extends EventEmitter {
    constructor(ms, timeoutError) {
        super()
        this._ms = ms
        this._timeoutError = timeoutError
        this._timer = setTimeout(this._onTimeout.bind(this), ms)
    }

    _onTimeout() {
        this.emit('timeout', this._timeoutError)
    }

    delay(ms = null) {
        if (this._timer) {
            clearTimeout(this._timer)
            this._timer = setTimeout(this._onTimeout.bind(this), ms || this._ms)
        }
    }

    cancel() {
        if (this._timer) {
            clearTimeout(this._timer)
            this._timer = 0
        }
    }
}


class Util {

    /**
     * Returns true if the actual version is greater than
     * or equal to the desired version.
     *
     * @param {string} desired The desired version.
     * @param {string} actual The actual version.
     */
    static mcVersionAtLeast(desired, actual) {
        const des = desired.split('.')
        const act = actual.split('.')

        for (let i = 0; i < des.length; i++) {
            const aInt = act.length > i ? parseInt(act[i]) : 0
            const dInt = parseInt(des[i])
            if (aInt > dInt) {
                return true
            } else if (aInt < dInt) {
                return false
            }
        }
        return true
    }

    /**
     * Calculates the hash for a file using the specified algorithm.
     *
     * @param {string} filepath The buffer containing file data.
     * @param {string} algo The hash algorithm.
     * @returns {Promise} The calculated hash in hex.
     */
    static calculateHash(filepath, algo) {
        return new Promise(async (resolve, reject) => {
            let hash
            if (algo === 'sha512' || algo === 'md5') {
                hash = crypto.createHash(algo)
            } else if (algo === 'xxh128') {
                resolve(await this.calculateHashXX3(filepath))
                return
            } else {
                reject('Unsupported hash algorithm: ' + algo)
                return
            }

            let stream = fs.createReadStream(filepath)
            stream.on('error', reject)
            stream.on('data', chunk => hash.update(chunk))
            stream.on('end', () => resolve(hash.digest().toString('hex')))
        })
    }

    static async getToolPath(toolname) {
        let toolPath = Array(3).fill('..')
        if (!isDev) {
            toolPath = Array(5).fill('..')
            toolPath.push('resources')
        }
        toolPath.push('tools')

        const myArch = arch()
        switch (process.platform) {
            case 'win32':
                toolPath.push('win')
                switch (toolname) {
                    case 'patcher':
                        if (myArch === 'x64') {
                            toolPath.push('hpatchz64.exe')
                        } else if (myArch === 'x86') {
                            toolPath.push('hpatchz32.exe')
                        }
                        break
                    case 'hasher':
                        toolPath.push('xxhsum.exe')
                        break
                }
                break
            case 'linux':
                toolPath.push('linux')
                switch (toolname) {
                    case 'patcher':
                        if (myArch === 'x64') {
                            toolPath.push('hpatchz64')
                        } else if (myArch === 'x86') {
                            toolPath.push('hpatchz32')
                        }
                        break
                    case 'hasher':
                        toolPath.push('xxhsum')
                        break
                }
        }

        const toolFile = path.join(__dirname, ...toolPath)
        try {
            await fs.promises.access(toolFile, fs.constants.R_OK)
        } catch (err) {
            console.error('Unsupported platform!', err)
            throw err
        }
        return toolFile
    }

    static async calculateHashXX3(filepath) {
        const {stdout} = await execFile(await this.getToolPath('hasher'), ['-H2', filepath])
        return stdout.slice(0, 32)
    }

    /**
     * Validate that a file exists and matches a given hash value.
     *
     * @param {string} filePath The path of the file to validate.
     * @param {string} algo The hash algorithm to check against.
     * @param {string} hash The existing hash to check against.
     * @param {number} sizeBytes The expected size of the file in byte.
     * @returns {boolean} True if the file exists and calculated hash matches the given hash, otherwise false.
     */
    static async validateLocal(filePath, algo, hash, sizeBytes) {
        try {
            if (!await fs.pathExists(filePath)) {
                return false
            }
            if (sizeBytes != null) {
                const stats = await fs.stat(filePath)
                const currentSize = stats.size
                if (currentSize !== sizeBytes) {
                    return false
                }
            }
            if (hash != null) {
                const currentHash = await Util.calculateHash(filePath, algo)
                if (currentHash !== hash) {
                    return false
                }
            }
            return true
        } catch (e) {
            console.error(`Failed to validate file ${filePath}`, e)
            return false
        }
    }

    /**
     * @param {string} checksumUri
     * @returns {{algo: string, hash: string}}
     */
    static parseChecksum(checksumUri) {
        const checksum = checksumUri.split(':', 2)
        const algo = checksum[0].toLowerCase()
        const hash = checksum[1]
        return {'algo': algo, 'hash': hash}
    }
}

module.exports = {
    TimeoutEmitter,
    Util,
}
