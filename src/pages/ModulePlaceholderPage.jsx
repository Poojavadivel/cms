import Layout from '../components/Layout'

export default function ModulePlaceholderPage({ title, description }) {
  return (
    <Layout title={title}>
      <div className="content-card">
        <div className="section-header" style={{ marginBottom: 14 }}>
          <span className="section-title">{title}</span>
        </div>
        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
          {description || `${title} module is available, but the detailed screen is under setup.`}
        </p>
      </div>
    </Layout>
  )
}
