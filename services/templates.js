const { ENV, SERVER_NAME, SERVER_MESSAGES: sm } = require('../config');

module.exports = {
    /**
   * Create an internal error template
   * @param error {string|*} - error to be sent
   * @return {object}
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
   * @return {object}
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
};
