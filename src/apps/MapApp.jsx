import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { mapDatabase } from '../utils/sharedData';
import { wsClient } from '../utils/websocket';
import { database } from '../utils/database';
import { MapIcon, PlusIcon, XIcon, TrashIcon, CheckIcon, EditIcon } from '../components/icons/Icons';
import 'leaflet/dist/leaflet.css';
import './MapApp.css';

// Fix for default marker icons in react-leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function MapApp() {
  const [pins, setPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]); // Default to London
  const character = database.getCurrentCharacter();

  const loadPins = () => {
    const allPins = mapDatabase.getAllPins();
    setPins(allPins);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPins();

    if (wsClient) {
      wsClient.on('map_sync', (data) => {
        if (data.pins) {
          mapDatabase.syncPins(data.pins);
          loadPins();
        }
      });
    }

    return () => {
      if (wsClient) {
        wsClient.off('map_sync');
      }
    };
  }, []);

  const handleMapClick = (latlng) => {
    if (isAddingPin) {
      setNewPinLocation(latlng);
    }
  };

  const handleCreatePin = (pinData) => {
    const newPin = {
      ...pinData,
      lat: newPinLocation.lat,
      lng: newPinLocation.lng,
      author: character?.name || 'Unknown'
    };

    const saved = mapDatabase.savePin(newPin);
    loadPins();
    setIsAddingPin(false);
    setNewPinLocation(null);
    setSelectedPin(saved);

    // Sync with other players
    if (wsClient.connected) {
      wsClient.syncMap(mapDatabase.getAllPins());
    }
  };

  const handleUpdatePin = (pin) => {
    const saved = mapDatabase.savePin(pin);
    loadPins();
    setSelectedPin(saved);

    if (wsClient.connected) {
      wsClient.syncMap(mapDatabase.getAllPins());
    }
  };

  const handleDeletePin = (id) => {
    if (confirm('Are you sure you want to delete this pin?')) {
      mapDatabase.deletePin(id);
      loadPins();
      setSelectedPin(null);

      if (wsClient.connected) {
        wsClient.syncMap(mapDatabase.getAllPins());
      }
    }
  };

  const handleCancelAddPin = () => {
    setIsAddingPin(false);
    setNewPinLocation(null);
  };

  return (
    <div className="map-app">
      <div className="map-header">
        <h1><MapIcon size={32} /> Map</h1>
        <div className="map-controls">
          {!isAddingPin ? (
            <button
              className="btn-add-pin"
              onClick={() => setIsAddingPin(true)}
            >
              <PlusIcon size={16} /> Add Pin
            </button>
          ) : (
            <div className="adding-mode">
              <span>Click on map to place pin</span>
              <button className="btn-cancel-add" onClick={handleCancelAddPin}>
                <XIcon size={16} /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="map-content">
        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            
            {pins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                eventHandlers={{
                  click: () => {
                    setSelectedPin(pin);
                    setIsAddingPin(false);
                  }
                }}
              >
                <Popup>
                  <strong>{pin.name}</strong>
                  <br />
                  <small>by {pin.author}</small>
                </Popup>
              </Marker>
            ))}

            {newPinLocation && (
              <Marker position={[newPinLocation.lat, newPinLocation.lng]}>
                <Popup>New pin location</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        <div className="map-sidebar">
          {newPinLocation && isAddingPin ? (
            <PinForm
              onSave={handleCreatePin}
              onCancel={handleCancelAddPin}
            />
          ) : selectedPin ? (
            <PinDetails
              pin={selectedPin}
              onUpdate={handleUpdatePin}
              onDelete={handleDeletePin}
              onClose={() => setSelectedPin(null)}
            />
          ) : (
            <div className="map-info">
              <h3>Shared Map</h3>
              <p>
                This map is synchronized with all party members. Add pins to mark
                important locations, quest objectives, or points of interest.
              </p>
              <div className="map-stats">
                <div className="stat-item">
                  <span className="stat-value">{pins.length}</span>
                  <span className="stat-label">Total Pins</span>
                </div>
              </div>
              <div className="pin-list">
                <h4>All Pins</h4>
                {pins.length === 0 ? (
                  <p className="empty-state">No pins yet. Click "Add Pin" to create one.</p>
                ) : (
                  <div className="pin-items">
                    {pins.map((pin) => (
                      <div
                        key={pin.id}
                        className="pin-list-item"
                        onClick={() => {
                          setSelectedPin(pin);
                          setMapCenter([pin.lat, pin.lng]);
                        }}
                      >
                        <div className="pin-name">{pin.name}</div>
                        <div className="pin-author">by {pin.author}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PinForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('location');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a name for the pin');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      category
    });
  };

  return (
    <div className="pin-form">
      <h3>New Pin</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Safe House, Quest Location"
            required
          />
        </div>

        <div className="form-field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="location">Location</option>
            <option value="quest">Quest</option>
            <option value="danger">Danger</option>
            <option value="safe">Safe Zone</option>
            <option value="resource">Resource</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes about this location..."
            rows={4}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save">
            <CheckIcon size={16} /> Save Pin
          </button>
          <button type="button" className="btn-cancel" onClick={onCancel}>
            <XIcon size={16} /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function PinDetails({ pin, onUpdate, onDelete, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(pin.name);
  const [description, setDescription] = useState(pin.description || '');
  const [category, setCategory] = useState(pin.category || 'location');

  const handleUpdate = () => {
    onUpdate({
      ...pin,
      name: name.trim(),
      description: description.trim(),
      category
    });
    setIsEditing(false);
  };

  const categoryLabels = {
    location: 'Location',
    quest: 'Quest',
    danger: 'Danger',
    safe: 'Safe Zone',
    resource: 'Resource',
    other: 'Other'
  };

  return (
    <div className="pin-details">
      <div className="pin-details-header">
        <h3>
          {categoryLabels[pin.category] || 'Location'} - {pin.name}
        </h3>
        <button className="btn-close" onClick={onClose}>
          <XIcon size={16} />
        </button>
      </div>

      {isEditing ? (
        <div className="pin-edit">
          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="location">Location</option>
              <option value="quest">Quest</option>
              <option value="danger">Danger</option>
              <option value="safe">Safe Zone</option>
              <option value="resource">Resource</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-field">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button className="btn-save" onClick={handleUpdate}>
              <CheckIcon size={16} /> Save
            </button>
            <button className="btn-cancel" onClick={() => setIsEditing(false)}>
              <XIcon size={16} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="pin-view">
          <div className="pin-meta">
            <span>Coords: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}</span>
            <span>By: {pin.author}</span>
            <span>Updated: {new Date(pin.updatedAt).toLocaleString()}</span>
          </div>

          {pin.description && (
            <div className="pin-description">
              <strong>Notes:</strong>
              <p>{pin.description}</p>
            </div>
          )}

          <div className="pin-actions">
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              <EditIcon size={16} /> Edit
            </button>
            <button className="btn-delete" onClick={() => onDelete(pin.id)}>
              <TrashIcon size={16} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
