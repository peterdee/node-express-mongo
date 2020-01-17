module.exports = {
  /**
   * Create a password recovery template
   * @param recoveryLink {string} - recovery link
   * @param userName {string} - user name
   * @return {object}
   */
  createPasswordRecoveryTemplate: (recoveryLink = '', userName = '') => ({
    subject: 'Password Recovery',
    template: `
<div style="background-color: #006d0d; padding: 5px 15px;">
  <h1 style="color: white;">Password Recovery</h1>
</div>
<div style="font-size: 16px; padding: 5px 15px;">
  <br>
  <div>Hi <b>${userName}</b>!</div>
  <br>
  <div><b>Your Password Recovery link:</b></div>
  <br>
  <div><a href="${recoveryLink}">${recoveryLink}</a></div>
  <br>
</div>
  `,
  }),
};
