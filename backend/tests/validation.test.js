const {
  registerSchema,
  loginSchema,
  createComplaintSchema,
  updateComplaintSchema,
  validateComplaintSchema,
  submitFeedbackSchema
} = require('../src/validators');

describe('Validation Schemas', () => {
  describe('Register Schema', () => {
    it('should validate a correct registration payload', () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'citizen',
        phone: '1234567890'
      };
      const { error } = registerSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should fail on invalid email', () => {
      const payload = {
        name: 'John Doe',
        email: 'john-invalid',
        password: 'password123'
      };
      const { error } = registerSchema.validate(payload);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('email');
    });

    it('should fail on short password', () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123'
      };
      const { error } = registerSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });

  describe('Login Schema', () => {
    it('should validate a correct login payload', () => {
      const payload = {
        email: 'john@example.com',
        password: 'password123'
      };
      const { error } = loginSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should fail when email is missing', () => {
      const payload = {
        password: 'password123'
      };
      const { error } = loginSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });

  describe('Create Complaint Schema', () => {
    it('should validate correct complaint payload', () => {
      const payload = {
        title: 'Water Leakage',
        description: 'Large water leak on Main Street near house 24',
        department: 'Water Supply',
        priority: 'medium'
      };
      const { error } = createComplaintSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should fail when description is too short', () => {
      const payload = {
        title: 'Water Leakage',
        description: 'Leak',
        department: 'Water Supply'
      };
      const { error } = createComplaintSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });

  describe('Feedback Schema', () => {
    it('should validate correct feedback', () => {
      const payload = {
        complaintId: '507f1f77bcf86cd799439011',
        rating: 5,
        comment: 'Great job!'
      };
      const { error } = submitFeedbackSchema.validate(payload);
      expect(error).toBeUndefined();
    });

    it('should fail on invalid rating', () => {
      const payload = {
        complaintId: '507f1f77bcf86cd799439011',
        rating: 6
      };
      const { error } = submitFeedbackSchema.validate(payload);
      expect(error).toBeDefined();
    });
  });
});
