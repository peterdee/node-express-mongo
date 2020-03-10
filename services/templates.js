const { ENV, SERVER_NAME, SERVER_MESSAGES: sm } = require('../config');

module.exports = {
  /**
   * Create an account recovery template
   * @param recoveryLink {string} - recovery link
   * @param userName {string} - user name
   * @returns {{ subject: string, template: string }}
   */
  createAccountRecoveryTemplate: (recoveryLink = '', userName = '') => ({
    subject: `${SERVER_NAME}: Account Recovery`,
    template: `
<div style="background-color: #006d0d; padding: 5px 15px;">
  <h1 style="color: white;">${SERVER_NAME}: Account Recovery</h1>
</div>
<div style="font-size: 16px; padding: 5px 15px;">
  <br>
  <div>Hi <b>${userName}</b>!</div>
  <br>
  <div>
    <b>Your Account Recovery link:</b>
  </div>
  <br>
  <div>
    <a href="${recoveryLink}">${recoveryLink}</a>
  </div>
  <br>
</div>
    `,
  }),
  /**
   * Create an email verification template
   * @param recoveryLink {string} - recovery link
   * @param userName {string} - user name
   * @returns {{ subject: string, template: string }}
   */
  createEmailVerificationTemplate: (recoveryLink = '', userName = '') => ({
    subject: `${SERVER_NAME}: Email Verification`,
    template: `
<div style="background-color: #006d0d; padding: 5px 15px;">
  <h1 style="color: white;">${SERVER_NAME}: Email Verification</h1>
</div>
<div style="font-size: 16px; padding: 5px 15px;">
  <br>
  <div>Hi <b>${userName}</b>!</div>
  <br>
  <div>
    <b>Your Email Verification link:</b>
  </div>
  <br>
  <div>
    <a href="${recoveryLink}">${recoveryLink}</a>
  </div>
  <br>
</div>
    `,
  }),
  /**
   * Create an internal error template
   * @param error {string|*} - error to be sent
   * @returns {{ subject: string, template: string }}
   */
  createInternalErrorTemplate: (error) => ({
    subject: `${SERVER_NAME}: ${sm.internalServerError.split('_').join(' ').toUpperCase()} [${ENV.toUpperCase()}]`,
    template: `
<div style="background-color: #7a0004; padding: 5px 15px;">
  <h1 style="color: white;">
    ${SERVER_NAME}: ${sm.internalServerError.split('_').join(' ').toUpperCase()} [${ENV.toUpperCase()}]
  </h1>
</div>
<div style="font-size: 16px; padding: 5px 15px;">
  <br>
  <div>
    <b>This is a notification about an internal error!</b>
  </div>
  <div>
    <b>Error message:</b>
  </div>
  <div>${error}</div>
  <div>
    <b>Date:</b>
  </div>
  <div>${new Date()} (${Date.now()})</div>
</div>
    `,
  }),
  /**
   * Create a password recovery template
   * @param recoveryLink {string} - recovery link
   * @param userName {string} - user name
   * @return {{ subject: string, template: string }}
   */
  createPasswordRecoveryTemplate: (recoveryLink = '', userName = '') => ({
    subject: `${SERVER_NAME}: Password Recovery`,
    template: `
<div style="background-color: #006d0d; padding: 5px 15px;">
  <h1 style="color: white;">${SERVER_NAME}: Password Recovery</h1>
</div>
<div style="font-size: 16px; padding: 5px 15px;">
  <br>
  <div>Hi <b>${userName}</b>!</div>
  <br>
  <div>
    <b>Your Password Recovery link:</b>
  </div>
  <br>
  <div><a href="${recoveryLink}">${recoveryLink}</a></div>
  <br>
</div>
    `,
  }),
  /**
   * Create a special error template
   * @param error {string|*} - error to be sent
   * @param func {string} - function name
   * @param misc {string} - additional information
   * @return {{ subject: string, template: string }}
   */
  createSpecialErrorTemplate: (error, func = '', misc = sm.noAdditionalInformation) => ({
    subject: `${SERVER_NAME}: SPECIAL SERVER ERROR [${ENV.toUpperCase()}]`,
    template: `
<div style="background-color: #7a0004; padding: 5px 15px;">
  <h1 style="color: white;">${SERVER_NAME}: SPECIAL SERVER ERROR [${ENV.toUpperCase()}]</h1>
</div>
<div style="font-size: 16px; padding: 5px 15px;">
  <br>
  <div>
    <b>This is a notification about a special server error!</b>
  </div>
  <div>
    <b>Error message:</b>
  </div>
  <div>${error}</div>
  <div>
    <b>Additional information:</b>
  </div>
  <div>${misc}</div>
  <div>
    <b>Function:</b>
  </div>
  <div>${func}</div>
  <div>
    <b>Date:</b>
  </div>
  <div>${new Date()} (${Date.now()})</div>
</div>
    `,
  }),
};
