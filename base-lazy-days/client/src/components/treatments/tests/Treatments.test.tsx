import { render, screen } from '@testing-library/react';

import { Treatments } from '../Treatments';

test('renders response from query', () => {
  render(<Treatments />);
});
