const fs = require('fs');
const filePath = 'D:/wholesale pooja/frontend/src/pages/delivery-detail-page.tsx';
let txt = fs.readFileSync(filePath, 'utf8');

txt = txt.replace('const [delivery, setDelivery] = useState<Delivery | null>(null);',
  'const [delivery, setDelivery] = useState<Delivery | null>(null);\n  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);');

const statusHandler = `
  const handleStatusChange = async (newStatus: string) => {
    if (!delivery) return;
    try {
      setIsUpdatingStatus(true);
      const updated = await unwrap(api.patch(\`/deliveries/\${delivery.id}\`, { deliveryStatus: newStatus }));
      setDelivery(updated);
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!delivery) {`;

txt = txt.replace('  if (!delivery) {', statusHandler);

const selectElement = `<select 
              value={delivery.deliveryStatus}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-md border border-slate-300 py-1 pl-3 pr-8 text-sm font-semibold focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
            >
              <option value="QUOTED">QUOTED</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="NOT_DELIVERED">NOT DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="REVISIT_DUE">REVISIT DUE</option>
              <option value="OVERDUE">OVERDUE</option>
            </select>`;

txt = txt.replace('<Badge value={delivery.deliveryStatus} />', selectElement);

fs.writeFileSync(filePath, txt);
