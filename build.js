const builder = require('electron-builder')
const Platform = builder.Platform

function getCurrentPlatform() {
    switch (process.platform) {
        case 'win32':
            return Platform.WINDOWS
        case 'darwin':
            return Platform.MAC
        case 'linux':
            return Platform.linux
        default:
            console.error('Cannot resolve current platform!')
            return undefined
    }
}

builder.build({
    targets: (process.argv[2] != null && Platform[process.argv[2]] != null ? Platform[process.argv[2]] : getCurrentPlatform()).createTarget(),
    publish: 'always',
    config: {
        generateUpdatesFilesForAllChannels: true,
        appId: 'nblade.bladelauncher',
        productName: 'BladeLauncher',
        artifactName: 'BladeLauncher-setup.${ext}',
        copyright: 'Copyright © 2019-2021 N-Blade LLC',
        directories: {
            buildResources: 'build',
            output: 'dist'
        },
        publish: [{
            provider: 'github',
            releaseType: 'release',
        }],
        win: {
            icon: 'app/assets/images/SealCircle.ico',
            target: [
                {
                    target: 'nsis-web',
                    arch: [
                        'x64',
                        'ia32'
                    ]
                }
            ],
            legalTrademarks: 'N-blade',
            sign: './sign.js',
            signAndEditExecutable: true,
            signDlls: true,
            extraResources: [
                'tools/win'
            ],
        },
        nsis: {
            oneClick: true,
            perMachine: false,
            allowElevation: true,
            allowToChangeInstallationDirectory: false,
            deleteAppDataOnUninstall: true,
            language: '1049'
        },
        mac: {
            target: 'dmg',
            category: 'public.app-category.games'
        },
        linux: {
            icon: 'build/icon.png',
            target: [
                'pacman',
                'deb'
            ],
            maintainer: 'N-Blade LLC',
            vendor: 'N-Blade LLC',
            synopsis: 'Northern Blade Launcher',
            description: 'Game launcher which allows users to join servers and handle updates automatically.',
            category: 'Game',
            extraResources: [
                'tools/linux'
            ],
        },
        compression: 'maximum',
        files: [
            '!{dist,.gitignore,.vscode,docs,dev-app-update.yml,.travis.yml,.nvmrc,.eslintrc.json,build.js}'
        ],
        asar: true
    }
}).then(() => {
    console.log('Build complete!')
}).catch(err => {
    console.error('Error during build!', err)
})
