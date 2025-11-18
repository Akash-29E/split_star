import './MemberManagement.css'

function MemberManagement({ groupData, onBack, initialGroupData, isSharedAccess, authenticatedMember }) {
  // Use initialGroupData if provided (for shared access), otherwise use groupData
  const currentGroupData = initialGroupData || groupData;
  
  // Determine the current user
  const currentUser = isSharedAccess && authenticatedMember 
    ? authenticatedMember 
    : currentGroupData?.members?.find(member => member.role === 'admin') || 
      currentGroupData?.members?.[0];

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
                currentGroupData.members.map((member, index) => {
                  // Check if this member is the current user
                  const isCurrentUser = (
                    (member._id && currentUser?._id && member._id === currentUser._id) ||
                    (member.id && currentUser?.id && member.id === currentUser.id) ||
                    (member.pin && currentUser?.pin && member.pin === currentUser.pin) ||
                    (member.name && currentUser?.name && member.name === currentUser.name)
                  );
                  
                  console.log('Member:', member.name, 'isCurrentUser:', isCurrentUser, 'currentUser:', currentUser?.name);
                  
                  return (
                    <div key={member._id || index} className="member-card">
                      <div className="member-card-content">
                        <div className="member-avatar">
                          {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="member-info">
                          <span className="member-name">{member.name}</span>
                          <span className="member-role">{member.role} • {member.accessLevel}</span>
                        </div>
                      </div>
                      <div className="member-card-actions">
                        {isCurrentUser ? (
                          <>
                            <button className="member-action-icon" title="Edit member">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L4.99967 13.6667L1.33301 14.6667L2.33301 11L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <div className="member-action-icon disabled"></div>
                            <div className="member-action-icon disabled"></div>
                          </>
                        ) : (
                          <>
                            <button className="member-action-icon" title="Edit member">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L4.99967 13.6667L1.33301 14.6667L2.33301 11L11.333 2.00004Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button className="member-action-icon" title="Delete member">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 4H3.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5.33301 4.00004V2.66671C5.33301 2.31309 5.47348 1.97395 5.72353 1.7239C5.97358 1.47385 6.31272 1.33337 6.66634 1.33337H9.33301C9.68663 1.33337 10.0258 1.47385 10.2758 1.7239C10.5259 1.97395 10.6663 2.31309 10.6663 2.66671V4.00004M12.6663 4.00004V13.3334C12.6663 13.687 12.5259 14.0261 12.2758 14.2762C12.0258 14.5262 11.6866 14.6667 11.333 14.6667H4.66634C4.31272 14.6667 3.97358 14.5262 3.72353 14.2762C3.47348 14.0261 3.33301 13.687 3.33301 13.3334V4.00004H12.6663Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <button className="member-action-icon" title="Share with member">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 5.33337C13.1046 5.33337 14 4.43794 14 3.33337C14 2.22881 13.1046 1.33337 12 1.33337C10.8954 1.33337 10 2.22881 10 3.33337C10 4.43794 10.8954 5.33337 12 5.33337Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M4 10C5.10457 10 6 9.10461 6 8.00004C6 6.89547 5.10457 6.00004 4 6.00004C2.89543 6.00004 2 6.89547 2 8.00004C2 9.10461 2.89543 10 4 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 14.6666C13.1046 14.6666 14 13.7712 14 12.6666C14 11.5621 13.1046 10.6666 12 10.6666C10.8954 10.6666 10 11.5621 10 12.6666C10 13.7712 10.8954 14.6666 12 14.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M5.72656 9.00671L10.2799 11.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10.2732 4.34003L5.72656 6.99337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemberManagement