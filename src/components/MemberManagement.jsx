import './MemberManagement.css'

function MemberManagement({ groupData, onBack, initialGroupData }) {
  // Use initialGroupData if provided (for shared access), otherwise use groupData
  const currentGroupData = initialGroupData || groupData;

  return (
    <div className="main-content">
      <div className="member-management-container">
        <div className="member-management-header">
          <button className="back-button" onClick={onBack}>
            ← Back to Group
          </button>
          <h1 className="page-title">Member Management</h1>
        </div>
        
        <div className="member-management-content">
          <div className="group-info">
            <h2>Group Details</h2>
            <div className="group-detail-item">
              <span className="detail-label">Group Name:</span>
              <span className="detail-value">{currentGroupData?.groupName}</span>
            </div>
            <div className="group-detail-item">
              <span className="detail-label">Total Members:</span>
              <span className="detail-value">{currentGroupData?.personCount || currentGroupData?.members?.length}</span>
            </div>
          </div>
          
          <div className="members-list">
            <h2>Members</h2>
            <div className="members-grid">
              {currentGroupData?.members && currentGroupData.members.length > 0 && (
                currentGroupData.members.map((member, index) => (
                  <div key={member._id || index} className="member-card">
                    <div className="member-avatar">
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{member.name}</span>
                      <span className="member-role">{member.role} • {member.accessLevel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberManagement