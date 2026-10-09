export function validateLoginInput(body) {
  const errors = {};

  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: { body: 'Request body is required' },
    };
  }

  const { email, password } = body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email wajib diisi';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Format email tidak valid';
    }
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password wajib diisi';
  } else if (password.length < 6) {
    errors.password = 'Password minimal 6 karakter';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
