exports.default = async function (configuration) {
    const SIGNER_EXE = process.env.SIGNER_EXE;

    require("child_process").execSync(
        `"${SIGNER_EXE}" "${configuration.path}"`,
        {
            stdio: "inherit"
        }
    );
};