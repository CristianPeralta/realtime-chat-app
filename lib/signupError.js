function signupFailure(err) {
  if (err && err.code === 11000) {
    return {
      status: 409,
      body: { error: 'That username or email is already registered' }
    };
  }
  return { status: 503 };
}

module.exports = { signupFailure: signupFailure };
