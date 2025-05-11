import { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminComponentProps } from '../../../types/admin';
import { Publication } from '../../../types/resume';

interface PublicationsManagerProps extends AdminComponentProps {
  onDataChanged?: () => void;
}

const PublicationsManager: React.FC<PublicationsManagerProps> = ({
  showNotification,
  onDataChanged
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPublication, setCurrentPublication] = useState<Publication | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    publisher: '',
    year: '',
    url: ''
  });

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('publications')
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;
      setPublications(data || []);
    } catch (error) {
      console.error('Error fetching publications:', error);
      showNotification('Error', 'Failed to load publications data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      publisher: '',
      year: '',
      url: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddClick = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleEditClick = (pub: Publication) => {
    setCurrentPublication(pub);
    setFormData({
      title: pub.title || '',
      publisher: pub.publisher || '',
      year: pub.year?.toString() || '',
      url: pub.url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('publications')
        .insert([{
          title: formData.title,
          publisher: formData.publisher || null,
          year: formData.year ? parseInt(formData.year) : null,
          url: formData.url || null
        }]);

      if (error) throw error;

      showNotification('Success', 'Publication added successfully');
      setIsAddModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchPublications();
    } catch (error) {
      console.error('Error adding publication:', error);
      showNotification('Error', 'Failed to add publication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPublication) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('publications')
        .update({
          title: formData.title,
          publisher: formData.publisher || null,
          year: formData.year ? parseInt(formData.year) : null,
          url: formData.url || null
        })
        .eq('id', currentPublication.id);

      if (error) throw error;

      showNotification('Success', 'Publication updated successfully');
      setIsEditModalOpen(false);
      resetForm();
      if (onDataChanged) onDataChanged();
      await fetchPublications();
    } catch (error) {
      console.error('Error updating publication:', error);
      showNotification('Error', 'Failed to update publication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;
    
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('publications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showNotification('Success', 'Publication deleted successfully');
      if (onDataChanged) onDataChanged();
      await fetchPublications();
    } catch (error) {
      console.error('Error deleting publication:', error);
      showNotification('Error', 'Failed to delete publication');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPublicationsList = () => {
    if (publications.length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">No publications found.</p>
        </div>
      );
    }

    // Group publications by year
    const groupedByYear: Record<string, Publication[]> = {};
    
    publications.forEach(pub => {
      const year = pub.year?.toString() || 'Undated';
      if (!groupedByYear[year]) {
        groupedByYear[year] = [];
      }
      groupedByYear[year].push(pub);
    });

    // Sort years in descending order
    const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
      if (a === 'Undated') return 1;
      if (b === 'Undated') return -1;
      return parseInt(b) - parseInt(a);
    });

    return (
      <div className="space-y-8">
        {sortedYears.map(year => (
          <div key={year} className="border-b border-gray-200 pb-6 mb-6 last:border-0">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">{year}</h4>
            <div className="space-y-4">
              {groupedByYear[year].map(pub => (
                <div key={pub.id} className="bg-gray-50 p-4 rounded-lg relative">
                  <h5 className="text-lg font-medium text-gray-800 pr-16">{pub.title}</h5>
                  {pub.publisher && <p className="text-gold font-medium mt-1">{pub.publisher}</p>}
                  {pub.url && (
                    <a 
                      href={pub.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-gray-600 hover:text-gray-900 mt-1 flex items-center"
                      aria-label="View publication"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" /> <span className="text-sm">View</span>
                    </a>
                  )}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(pub)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Edit publication"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pub.id)}
                      className="text-gray-600 hover:text-gray-900"
                      aria-label="Delete publication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAddModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isAddModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4">Add New Publication</h3>
          <form onSubmit={handleSubmitAdd} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">
                Publisher
              </label>
              <input
                type="text"
                id="publisher"
                name="publisher"
                value={formData.publisher}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com/publication"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Add Publication'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isEditModalOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-semibold mb-4">Edit Publication</h3>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-publisher" className="block text-sm font-medium text-gray-700 mb-1">
                Publisher
              </label>
              <input
                type="text"
                id="edit-publisher"
                name="publisher"
                value={formData.publisher}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-year" className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                id="edit-year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear()}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="edit-url" className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                id="edit-url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com/publication"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title}
                className="px-4 py-2 bg-gold text-white rounded-md hover:bg-gold/90 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (isLoading && publications.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-gold text-white rounded hover:bg-gold/90 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Publication
        </button>
      </div>

      {renderPublicationsList()}
      {renderAddModal()}
      {renderEditModal()}
    </div>
  );
};

export default PublicationsManager;
