import './GroupSettings.css'

function GroupSettings({ groupData, onBack, onSave }) {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission logic here
    if (onSave) {
      onSave(groupData)
    }
  }

  return (
    <div className="main-content">
      <div className="group-settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Group Settings</h1>
          <button className="back-button" onClick={onBack}>
            Back to Group
          </button>
        </div>
        
        <div className="settings-content">
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="settings-section">
              <h2>Basic Information</h2>
              <div className="form-group">
                <label htmlFor="groupName">Group Name</label>
                <input
                  type="text"
                  id="groupName"
                  name="groupName"
                  defaultValue={groupData?.groupName}
                  className="form-input"
                  placeholder="Enter group name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={groupData?.description}
                  className="form-textarea"
                  placeholder="Enter group description"
                  rows="4"
                />
              </div>
            </div>

            <div className="settings-section">
              <h2>Privacy Settings</h2>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    defaultChecked={groupData?.isPrivate}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Make group private</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="allowInvites"
                    defaultChecked={groupData?.allowInvites !== false}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Allow members to invite others</span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h2>Notification Settings</h2>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    defaultChecked={groupData?.emailNotifications !== false}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Email notifications for group activities</span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    defaultChecked={groupData?.pushNotifications !== false}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Push notifications</span>
                </label>
              </div>
            </div>

            <div className="settings-section danger-zone">
              <h2>Danger Zone</h2>
              <div className="danger-actions">
                <button type="button" className="danger-btn">
                  Leave Group
                </button>
                <button type="button" className="danger-btn delete">
                  Delete Group
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onBack} className="secondary-btn">
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default GroupSettings