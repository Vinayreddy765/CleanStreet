import { validateCreateReport, validateUpdateReport } from '../lib/validation';

describe('validateCreateReport', () => {
  const valid = {
    location: 'Oak Street',
    category: 'plastic',
    severity: 'high',
    description: 'Big pile of waste',
  };

  it('accepts a valid report', () => {
    expect(validateCreateReport(valid).valid).toBe(true);
  });

  it('rejects missing location', () => {
    const { valid: v, errors } = validateCreateReport({ ...valid, location: '' });
    expect(v).toBe(false);
    expect(errors.some((e) => e.includes('location'))).toBe(true);
  });

  it('rejects invalid category', () => {
    const { valid: v, errors } = validateCreateReport({ ...valid, category: 'garbage' });
    expect(v).toBe(false);
    expect(errors.some((e) => e.includes('category'))).toBe(true);
  });

  it('rejects invalid severity', () => {
    const { valid: v, errors } = validateCreateReport({ ...valid, severity: 'critical' });
    expect(v).toBe(false);
    expect(errors.some((e) => e.includes('severity'))).toBe(true);
  });

  it('rejects missing description', () => {
    const { valid: v, errors } = validateCreateReport({ ...valid, description: '  ' });
    expect(v).toBe(false);
    expect(errors.some((e) => e.includes('description'))).toBe(true);
  });

  it('accepts optional photoUrl', () => {
    expect(validateCreateReport({ ...valid, photoUrl: 'https://example.com/img.jpg' }).valid).toBe(true);
  });

  it('rejects non-object body', () => {
    expect(validateCreateReport('not-an-object').valid).toBe(false);
  });
});

describe('validateUpdateReport', () => {
  it('accepts valid status transition input', () => {
    expect(validateUpdateReport({ status: 'in_progress' }).valid).toBe(true);
  });

  it('rejects invalid status', () => {
    const { valid, errors } = validateUpdateReport({ status: 'done' });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('status'))).toBe(true);
  });

  it('requires cleanupNote when resolving', () => {
    const { valid, errors } = validateUpdateReport({ status: 'resolved' });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('cleanupNote'))).toBe(true);
  });

  it('accepts resolved with cleanupNote', () => {
    expect(
      validateUpdateReport({ status: 'resolved', cleanupNote: 'Area cleaned.' }).valid
    ).toBe(true);
  });

  it('rejects negative wasteCollectedKg', () => {
    const { valid, errors } = validateUpdateReport({ wasteCollectedKg: -5 });
    expect(valid).toBe(false);
    expect(errors.some((e) => e.includes('wasteCollectedKg'))).toBe(true);
  });
});
