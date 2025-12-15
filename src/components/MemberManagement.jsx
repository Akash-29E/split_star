import { useState } from 'react'
import './MemberManagement.css'
import Popup from './Popup'
import groupService from '../services/groups'
import useToast from '../hooks/useToast'

function MemberManagement({ groupData, onBack, initialGroupData, isSharedAccess, authenticatedMember, onGroupUpdate }) {
  const [showAddMemberPopup, setShowAddMemberPopup] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAccessLevel, setNewMemberAccessLevel] = useState('full');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [selectedMemberToShare, setSelectedMemberToShare] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const { showToast } = useToast();

  // Use initialGroupData if provided (for shared access), otherwise use groupData
  const currentGroupData = initialGroupData || groupData;
  
  // Determine the current user
  const currentUser = isSharedAccess && authenticatedMember 
    ? authenticatedMember 
    : currentGroupData?.members?.find(member => member.role === 'admin') || 
      currentGroupData?.members?.[0];

  const handleAddMember = async () => {
    // Validate name
    if (!newMemberName.trim()) {
      showToast('Please enter a member name', 'error');
      return;
    }

    setIsAddingMember(true);
    
    try {
      const memberData = {
        name: newMemberName.trim(),
        accessLevel: newMemberAccessLevel
      };

      const response = await groupService.addMember(currentGroupData.uuid, memberData);
      
      if (response.success) {
        showToast(`${newMemberName} added successfully! PIN: ${response.data.member.pin}`, 'success');
        
        // Refresh group data if callback provided
        if (onGroupUpdate) {
          await onGroupUpdate();
        }
        
        // Close popup and reset form
        setShowAddMemberPopup(false);
        setNewMemberName('');
        setNewMemberAccessLevel('full');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      showToast(error.message || 'Failed to add member', 'error');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleCancelAddMember = () => {
    setShowAddMemberPopup(false);
    setNewMemberName('');
    setNewMemberAccessLevel('full');
  };

  const handleShareWithMember = (member) => {
    setSelectedMemberToShare(member);
    setShowSharePopup(true);
  };

  const handleCloseSharePopup = () => {
    setShowSharePopup(false);
    setSelectedMemberToShare(null);
  };

  const handleCopyShareInfo = () => {
    const shareLink = `${window.location.origin}/group/${currentGroupData.uuid}`;
    const shareText = `Enjoy splitting expenses with Splitstar, ${selectedMemberToShare.name}!\nYour PIN to login is: ${selectedMemberToShare.pin}\n${shareLink}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      showToast('Share information copied to clipboard!', 'success');
    }).catch((error) => {
      console.error('Failed to copy:', error);
      showToast('Failed to copy to clipboard', 'error');
    });
  };

  const handleDeleteMember = (member) => {
    setSelectedMemberToDelete(member);
    setShowDeletePopup(true);
  };

  const handleCancelDelete = () => {
    setShowDeletePopup(false);
    setSelectedMemberToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMemberToDelete) return;

    setIsDeletingMember(true);
    
    try {
      const response = await groupService.deleteMember(
        currentGroupData.uuid,
        selectedMemberToDelete._id || selectedMemberToDelete.id
      );
      
      if (response.success) {
        showToast(`${selectedMemberToDelete.name} has been removed from the group`, 'success');
        
        // Refresh group data if callback provided
        if (onGroupUpdate) {
          await onGroupUpdate();
        }
        
        // Close popup
        setShowDeletePopup(false);
        setSelectedMemberToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      showToast(error.message || 'Failed to delete member', 'error');
    } finally {
      setIsDeletingMember(false);
    }
  };

  return (
    <div className="main-content">
      <div className="member-management-container">
        <div className="member-management-header">
          <button className="back-button" onClick={onBack}>
            <img src="/svg/backarrow.svg" className="back-arrow-icon" alt="Back" /> Back to Group
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
                              <img src="/svg/editIcon.svg" width="16" height="16" alt="Edit" />
                            </button>
                            <div className="member-action-icon disabled"></div>
                            <div className="member-action-icon disabled"></div>
                          </>
                        ) : (
                          <>
                            <button className="member-action-icon" title="Edit member">
                              <img src="/svg/editIcon.svg" width="16" height="16" alt="Edit" />
                            </button>
                            <button 
                              className="member-action-icon" 
                              title="Delete member"
                              onClick={() => handleDeleteMember(member)}
                            >
                              <img src="/svg/deleteIcon.svg" width="16" height="16" alt="Delete" />
                            </button>
                            <button 
                              className="member-action-icon" 
                              title="Share with member"
                              onClick={() => handleShareWithMember(member)}
                            >
                              <img src="/svg/shareIcon.svg" width="16" height="16" alt="Share" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Add Member Card */}
              <div className="add-member-card" onClick={() => setShowAddMemberPopup(true)}>
                <div className="add-member-icon">
                  <img src="/svg/plusIcon.svg" width="40" height="40" alt="Add Member" />
                </div>
                <span className="add-member-text">Add Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Popup */}
      <Popup
        isOpen={showAddMemberPopup}
        onClose={isAddingMember ? undefined : handleCancelAddMember}
        title="Add New Member"
        subtitle="Enter member details"
        type="info"
        primaryButtonText={isAddingMember ? "Adding..." : "Add"}
        secondaryButtonText="Cancel"
        onPrimaryClick={handleAddMember}
        onSecondaryClick={handleCancelAddMember}
        showSecondaryButton={!isAddingMember}
      >
        <div className="add-member-form">
          <div className="form-group">
            <label htmlFor="memberName" className="form-label">Name</label>
            <input
              type="text"
              id="memberName"
              className="form-input"
              placeholder="Enter member name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              disabled={isAddingMember}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="accessLevel" className="form-label">Access Level</label>
            <select
              id="accessLevel"
              className="form-input"
              value={newMemberAccessLevel}
              onChange={(e) => setNewMemberAccessLevel(e.target.value)}
              disabled={isAddingMember}
            >
              <option value="full">Full Access</option>
              <option value="view-only">View Only</option>
            </select>
          </div>
        </div>
      </Popup>

      {/* Share Member Popup */}
      <Popup
        isOpen={showSharePopup}
        onClose={handleCloseSharePopup}
        title={`Share with ${selectedMemberToShare?.name || 'Member'}`}
        subtitle="Copy this information to share"
        type="info"
        primaryButtonText="Copy"
        secondaryButtonText="Close"
        onPrimaryClick={handleCopyShareInfo}
        onSecondaryClick={handleCloseSharePopup}
        showSecondaryButton={true}
      >
        <div className="share-info-container">
          <div className="share-info-box">
            <p className="share-text">
              Enjoy splitting expenses with Splitstar, {selectedMemberToShare?.name}!
            </p>
            <p className="share-text">
              Your PIN to login is: <strong>{selectedMemberToShare?.pin}</strong>
            </p>
            <p className="share-text share-link">
              {window.location.origin}/group/{currentGroupData?.uuid}
            </p>
          </div>
        </div>
      </Popup>

      {/* Delete Member Popup */}
      <Popup
        isOpen={showDeletePopup}
        onClose={isDeletingMember ? undefined : handleCancelDelete}
        title="Delete Member"
        subtitle={`Are you sure you want to remove ${selectedMemberToDelete?.name || 'this member'}?`}
        message="This member will be removed from the group. Their past expenses will remain but marked as deleted."
        type="error"
        primaryButtonText={isDeletingMember ? "Deleting..." : "Delete"}
        secondaryButtonText="Cancel"
        onPrimaryClick={handleConfirmDelete}
        onSecondaryClick={handleCancelDelete}
        showSecondaryButton={!isDeletingMember}
      />
    </div>
  );
}

export default MemberManagement;