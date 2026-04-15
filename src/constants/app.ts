import type { ReminderType, ShopStatus } from '../types/shop'

export interface DeliveryOrderLine {
  productType: string
  sizeLabel: string
}

export const regionAreaOptions = {
  'Bangalore South': [
    'Banashankari',
    'Jayanagar',
    'JP Nagar',
    'BTM Layout',
    'Uttarahalli',
    'Padmanabanagar',
    'Bommanahalli',
    'Koramangala',
    'RR Nagar',
    'Basavanagudi',
  ],
  'Bangalore North': [
    'Yelahanka',
    'Vidyaranyapura',
    'Sahakarnagar',
    'Hebbal',
    'RT Nagar',
    'Thanisandra',
    'Kodigehalli',
    'Jakkur',
    'Sanjaynagar',
    'RMV Extension',
    'Mathikere',
  ],
  'Bangalore Central': [
    'Ashoknagar',
    'Malleshwaram',
    'Church Street',
    'MG Road',
    'Brigade Road',
    'Sadashivnagar',
    'Ulsoor',
    'BEL Circle',
    'Shivajinagar',
    'Commercial Street',
    'Vasanth Nagar',
    'Guttahalli',
    'Rajajinagar',
    'Sheshadripuram',
  ],
  'Bangalore East': [
    'Whitefield',
    'Marathahalli',
    'Indiranagar',
    'HSR Layout',
    'KR Puram',
    'CV Raman Nagar',
    'Mahadevapura',
    'Bellandur',
    'Sarjapur',
  ],
  'Bangalore West': [
    'Jalahalli',
    'Yeshwanthpur',
    'Vijayanagar',
    'Kengeri',
    'Nagarbhavi',
    'Peenya',
    'Basaveshwaranagar',
    'Nayandahalli',
    'Hanumanthnagar',
  ],
  'Bangalore Rural': [
    'Devanahalli',
    'Dodaballapura',
    'Hoskote',
    'Airport Road Bangalore',
    'Tumkur Road',
    'Vijayapura',
    'Nelamangala',
    'Magadi',
    'Hesarghatta',
  ],
  'Mysore Road': [
    'Bidadi',
    'Ramnagar',
    'Kanakpura',
    'Channapatna',
    'Maddur',
    'Mandya',
    'Srirangapatna',
    'Other side of Mysore',
  ],
  Hosur: [
    'Bagalur Road',
    'Mathigiri',
    'Dankanikottai Road',
    'Anthivadi Hosur',
  ],
  Mysore: [
    'Vijayanagar',
    'Gokulam',
    'Kuvempunagar',
    'Jayanagar',
    'Bannimantap',
    'Palace Road',
    'Yadavgiri',
    'Brindavan Extension',
    'Siddhartha Nagar',
    'Chamundipuram',
  ],
} as const

export const regionOptions = Object.keys(regionAreaOptions) as Array<keyof typeof regionAreaOptions>

export const staffMembers = [
  'Sales Executive',
  'Field Officer',
  'Area Supervisor',
  'Relationship Manager',
  'Delivery Coordinator',
]

export const businessTypes = [
  'Retail Store',
  'Pharmacy',
  'Supermarket',
  'Distributor',
  'Electronics Shop',
  'Local Grocery',
]

export const productCategories = [
  'FMCG',
  'Packaged Foods',
  'Beverages',
  'Personal Care',
  'Cleaning Supplies',
  'Consumer Electronics',
]

export const deliveryCatalogRows = [
  { productName: 'Pooja Kit', milletSize: '1 Pack', bottleSize: '2 Packs' },
] as const

export const deliverySizeOptions = ['1 Pack', '2 Packs', '3 Packs', '4 Packs', '5 Packs', '6 Packs', '7 Packs', '8 Packs', '9 Packs', '10 Packs'] as const

export const reminderTypes: ReminderType[] = [
  'Monthly Revisit',
  'Delivery Follow-Up',
  'Relationship Check-In',
]

export const statusOrder: ShopStatus[] = [
  'New Lead',
  'Contacted',
  'Interested',
  'Order Confirmed',
  'Delivered',
  'Follow-Up Required',
  'Revisit Needed',
  'Inactive',
]

export const navItems = [
  { label: 'Dashboard', path: '/', shortLabel: 'Home' },
  { label: 'Shops', path: '/shops', shortLabel: 'Shops' },
  { label: 'Add Shop', path: '/shops/new', shortLabel: 'Add' },
  { label: 'Deliveries', path: '/deliveries', shortLabel: 'Delivery' },
  { label: 'Reminders', path: '/reminders', shortLabel: 'Tasks' },
  { label: 'Reports', path: '/reports', shortLabel: 'Reports' },
] as const
