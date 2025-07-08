export function calculateRego(state) {
  switch (state) {
    case 'VIC':
      return 900; // Base passenger rego + TAC
    case 'NSW':
      return 950; // Based on average light vehicle
    case 'QLD':
      return 850;
    case 'SA':
      return 800;
    case 'WA':
      return 850;
    case 'TAS':
      return 750;
    case 'ACT':
      return 830;
    case 'NT':
      return 790;
    default:
      return 900;
  }
}
