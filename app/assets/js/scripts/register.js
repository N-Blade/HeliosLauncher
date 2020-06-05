/**
 * Script for register.ejs
 */
// Validation Regexes.
// const validUsername         = /^[a-zA-Z0-9_]{1,16}$/
// const basicEmail            = /^\S+@\S+\.\S+$/
//const validEmail          = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

// register Elements
const registerCancelContainer  = document.getElementById('registerCancelContainer')
// const registerCancelButton     = document.getElementById('registerCancelButton')
const registerEmailError       = document.getElementById('registerEmailError')
const registerUsername         = document.getElementById('registerUsername')
const registerPasswordError    = document.getElementById('registerPasswordError')
const registerPassword         = document.getElementById('registerPassword')
// const checkmarkContainer    = document.getElementById('checkmarkContainer')
const registerRememberOption   = document.getElementById('registerRememberOption')
const registerButton           = document.getElementById('registerButton')
const registerForm             = document.getElementById('registerForm')

// Control variables.
// let lu = false, lp = false

const loggerregister = LoggerUtil('%c[register]', 'color: #000668; font-weight: bold')


/**
 * Show a register error.
 * 
 * @param {HTMLElement} element The element on which to display the error.
 * @param {string} value The error text.
 */
function showError(element, value){
    element.innerHTML = value
    element.style.opacity = 1
}

/**
 * Shake a register error to add emphasis.
 * 
 * @param {HTMLElement} element The element to shake.
 */
function shakeError(element){
    if(element.style.opacity == 1){
        element.classList.remove('shake')
        void element.offsetWidth
        element.classList.add('shake')
    }
}

/**
 * Validate that an email field is neither empty nor invalid.
 * 
 * @param {string} value The email value.
 */
function validateRegEmail(value){
    if(value){
        if(!basicEmail.test(value)){
            showError(registerEmailError, Lang.queryJS('register.error.invalidEmail'))
            registerDisabled(true)
            lu = false
        } else {
            registerEmailError.style.opacity = 0
            lu = true
            registerDisabled(false)
        }
    } else {
        lu = false
        showError(registerEmailError, Lang.queryJS('register.error.requiredValue'))
        registerDisabled(true)
    }
}

// Emphasize errors with shake when focus is lost.
registerUserMail.addEventListener('focusout', (e) => {
    validateRegEmail(e.target.value)
    shakeError(registerEmailError)
})

/**
 * Enable or disable the register button.
 * 
 * @param {boolean} v True to enable, false to disable.
 */

function registerDisabled(v){
    if(registerButton.disabled !== v){
        registerButton.disabled = v
    }
}

/**
 * Enable or disable loading elements.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
function registerLoading(v){
    if(v){
        registerButton.setAttribute('loading', v)
        registerButton.innerHTML = registerButton.innerHTML.replace(Lang.queryJS('register.register'), Lang.queryJS('register.loggingIn'))
    } else {
        registerButton.removeAttribute('loading')
        registerButton.innerHTML = registerButton.innerHTML.replace(Lang.queryJS('register.loggingIn'), Lang.queryJS('register.register'))
    }
}

/**
 * Enable or disable register form.
 * 
 * @param {boolean} v True to enable, false to disable.
 */
// function formDisabled(v){
//     registerDisabled(v)
//     registerCancelButton.disabled = v
//     registerUsername.disabled = v
//     registerPassword.disabled = v
//     if(v){
//         checkmarkContainer.setAttribute('disabled', v)
//     } else {
//         checkmarkContainer.removeAttribute('disabled')
//     }
//     registerRememberOption.disabled = v
// }

/**
 * Parses an error and returns a user-friendly title and description
 * for our error overlay.
 * 
 * @param {Error | {cause: string, error: string, errorMessage: string}} err A Node.js
 * error or Mojang error response.
 */
function resolveError(err){
    // Mojang Response => err.cause | err.error | err.errorMessage
    // Node error => err.code | err.message
    if(err.cause != null && err.cause === 'UserMigratedException') {
        return {
            title: Lang.queryJS('register.error.userMigrated.title'),
            desc: Lang.queryJS('register.error.userMigrated.desc')
        }
    } else {
        if(err.error != null){
            switch (err.error) {
                case 'ForbiddenOperationException': {
                    if (err.errorMessage != null) {
                        if (err.errorMessage === 'Invalid credentials. Invalid username or password.') {
                            return {
                                title: Lang.queryJS('register.error.invalidCredentials.title'),
                                desc: Lang.queryJS('register.error.invalidCredentials.desc')
                            }
                        } else if(err.errorMessage === 'Invalid credentials.') {
                            return {
                                title: Lang.queryJS('register.error.rateLimit.title'),
                                desc: Lang.queryJS('register.error.rateLimit.desc')
                            }
                        }
                    }
                }
                case 'Registration was not completed': {
                    if (err.errorMessage != null && err.errorMessage.startsWith('Please confirm you email address first.')) {
                        return {
                            title: Lang.queryJS('register.error.emailNotConfirmed.title'),
                            desc: Lang.queryJS('register.error.emailNotConfirmed.desc')
                        }
                    }
                }
            }
        } else {
            // Request errors (from Node).
            if(err.code != null){
                if(err.code === 'ENOENT'){
                    // No Internet.
                    return {
                        title: Lang.queryJS('register.error.noInternet.title'),
                        desc: Lang.queryJS('register.error.noInternet.desc')
                    }
                } else if(err.code === 'ENOTFOUND'){
                    // Could not reach server.
                    return {
                        title: Lang.queryJS('register.error.authDown.title'),
                        desc: Lang.queryJS('register.error.authDown.desc')
                    }
                }
            }
        }
    }
    if(err.message != null){
        if(err.message === 'NotPaidAccount'){
            return {
                title: Lang.queryJS('register.error.notPaid.title'),
                desc: Lang.queryJS('register.error.notPaid.desc')
            }
        }
    }
    return {
        title: Lang.queryJS('register.error.unknown.title'),
        desc: Lang.queryJS('register.error.unknown.desk')
    }
}

let registerViewOnSuccess = VIEWS.landing
let registerViewOnCancel = VIEWS.settings
let registerViewCancelHandler

function registerCancelEnabled(val){
    if(val){
        $(registerCancelContainer).show()
    } else {
        $(registerCancelContainer).hide()
    }
}

// registerCancelButton.onclick = (e) => {
//     switchView(getCurrentView(), registerViewOnCancel, 500, 500, () => {
//         registerUsername.value = ''
//         registerPassword.value = ''
//         registerCancelEnabled(false)
//         if(registerViewCancelHandler != null){
//             registerViewCancelHandler()
//             registerViewCancelHandler = null
//         }
//     })
// }

// Disable default form behavior.
registerForm.onsubmit = () => { return false }

// Bind register button behavior.
registerButton.addEventListener('click', () => {
    // Disable form.
    formDisabled(true)

    // Show loading stuff.
    registerLoading(true)

    AuthManager.registerAccount(registerUsername.value, registerPassword.value)
        .then((value) => {
            // return DistroManager.refresh()
            //     .then((d) => onDistroRefresh(d))
            //     .then(() => value)
        })    
        .then((value) => {
            updateSelectedAccount(value)
            registerButton.innerHTML = registerButton.innerHTML.replace(Lang.queryJS('register.loggingIn'), Lang.queryJS('register.success'))
            $('.circle-loader').toggleClass('load-complete')
            $('.checkmark').toggle()
            setTimeout(() => {
                switchView(VIEWS.register, registerViewOnSuccess, 500, 500, () => {
                    // Temporary workaround
                    if(registerViewOnSuccess === VIEWS.settings){
                        prepareSettings()
                    }
                    registerViewOnSuccess = VIEWS.landing // Reset this for good measure.
                    registerCancelEnabled(false) // Reset this for good measure.
                    registerViewCancelHandler = null // Reset this for good measure.
                    registerUsername.value = ''
                    registerPassword.value = ''
                    $('.circle-loader').toggleClass('load-complete')
                    $('.checkmark').toggle()
                    registerLoading(false)
                    registerButton.innerHTML = registerButton.innerHTML.replace(Lang.queryJS('register.success'), Lang.queryJS('register.register'))
                    formDisabled(false)
                })
            }, 1000)
        }).catch((err) => {
            registerLoading(false)
            const errF = resolveError(err)
            setOverlayContent(errF.title, errF.desc, Lang.queryJS('register.tryAgain'))
            setOverlayHandler(() => {
                formDisabled(false)
                toggleOverlay(false)
            })
            toggleOverlay(true)
            loggerregister.warn('Error while logging in.', err)
        })

})

// registerUsername.setAttribute('placeholder', Lang.queryJS('register.registerUsername'))
// registerPassword.setAttribute('placeholder', Lang.queryJS('register.registerPassword'))