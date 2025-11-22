import './CreateGroup.css'
import TextField from './TextField'
import Button from './Button'
import { useState, useEffect } from 'react'
import { validatePersonRemoval, validatePersonCount, validateForm, VALIDATION_RULES } from '../utils/validation'

function CreateGroup({ onCreateGroup, currentUser }) {
  const [personCount, setPersonCount] = useState(2)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [groupName, setGroupName] = useState('')
  const [personNames, setPersonNames] = useState(
    currentUser ? { 1: currentUser.name } : {}
  )

  // Update Person 1 name when currentUser becomes available
  useEffect(() => {
    if (currentUser && currentUser.name) {
      setPersonNames(prev => ({
        ...prev,
        1: currentUser.name
      }));
    }
  }, [currentUser]);

  const handleAddPerson = () => {
    const newCount = personCount + 1
    const validation = validatePersonCount(newCount)
    
    if (validation.isValid) {
      setPersonCount(newCount)
    } else {
      setToastMessage(validation.message)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const handleRemovePerson = () => {
    const validation = validatePersonRemoval(personCount)
    
    if (validation.canRemove) {
      setPersonCount(prev => {
        const newCount = prev - 1
        // Remove the person name from state when removing person
        const newPersonNames = { ...personNames }
        delete newPersonNames[prev]
        setPersonNames(newPersonNames)
        return newCount
      })
    } else {
      setToastMessage(validation.message)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const handleGroupNameChange = (e) => {
    setGroupName(e.target.value)
  }

  const handlePersonNameChange = (personIndex, e) => {
    setPersonNames(prev => ({
      ...prev,
      [personIndex]: e.target.value
    }))
  }

  const handleCreateGroup = () => {
    const formData = {
      groupName,
      personNames,
      personCount
    }
    
    const validation = validateForm(formData)
    
    if (validation.isValid) {
      onCreateGroup(formData)
    } else {
      setToastMessage(validation.message)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

return (
    <div className="main-content">
        <div className="create-group-container">
            <div className="page-header">
                <h1 className="page-title">Create New Group</h1>
                <p className="page-subtitle">Set up your group and add members to start splitting expenses</p>
            </div>
            <div className="group-name-field">
                <TextField 
                    label="Group name"
                    placeholder="Enter group name"
                    id="groupname"
                    value={groupName}
                    onChange={handleGroupNameChange}
                    maxLength={VALIDATION_RULES.MAX_GROUP_NAME_LENGTH}
                />
            </div>
            <div className="person-fields">
                {Array.from({ length: personCount }, (_, index) => (
                    <div key={index + 1} className="person-field-row" title={index === 0 && currentUser ? 'Current user' : ''}>
                        <TextField 
                            label={index === 0 ? 'Person 1 (You)' : `Person ${index + 1}`}
                            placeholder={`Enter name of person ${index + 1}`}
                            id={`person${index + 1}`}
                            value={personNames[index + 1] || ''}
                            onChange={(e) => handlePersonNameChange(index + 1, e)}
                            maxLength={VALIDATION_RULES.MAX_PERSON_NAME_LENGTH}
                            disabled={index === 0 && currentUser}
                        />
                        <Button variant="remove" size="small" onClick={handleRemovePerson}>
                            -
                        </Button>
                    </div>
                ))}
                <div className="action-buttons">
                    <Button variant="add" size="small" onClick={handleAddPerson}>
                        +
                    </Button>
                    <Button variant="create" size="large" onClick={handleCreateGroup}>
                        Create
                    </Button>
                </div>
            </div>
        </div>
        {showToast && (
            <div className="toast">
                {toastMessage}
            </div>
        )}
    </div>
)
}

export default CreateGroup