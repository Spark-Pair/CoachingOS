import { Download, QrCode, ScanLine, Users } from 'lucide-react'
import MetricCard from '../components/common/MetricCard'
import PageHeader from '../components/common/PageHeader'
import TablePanel from '../components/common/TablePanel'
import { qrCards } from '../data/mockData'

function QrPage() {
  return (
    <div className="page-layout">
      <PageHeader
        title="QR Cards"
        subtitle="Prepare class-based QR cards for printing and attendance scanning."
        action={(
          <button type="button" className="primary-button">
            <Download size={16} />
            Export A4 PDF
          </button>
        )}
      />
      <section className="metric-grid compact-four">
        <MetricCard icon={QrCode} label="Generated cards" value="248" tone="brand" />
        <MetricCard icon={Users} label="Selected students" value="36" tone="success" />
        <MetricCard icon={ScanLine} label="Scannable format" value="Ready" tone="info" />
      </section>
      <TablePanel title="Print preview" subtitle="Bulk printable QR cards grouped for classroom use.">
        <div className="qr-grid">
          {qrCards.map((card) => (
            <article key={card.student} className="qr-card">
              <div className="fake-qr" aria-hidden="true">
                <QrCode size={44} strokeWidth={1.8} />
              </div>
              <span className="text-emphasis">{card.student}</span>
              <span>{card.parent}</span>
              <span>{card.className}</span>
            </article>
          ))}
        </div>
      </TablePanel>
    </div>
  )
}

export default QrPage
