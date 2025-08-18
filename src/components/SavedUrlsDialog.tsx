import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "./ui/button"
import { supabase } from '@/utils/supabase'
import { useState, useEffect } from "react"
import { Input } from "./ui/input"
import { Trash2, Edit, Plus, Save, X, LayoutDashboard } from "lucide-react"

interface CanvaTemplate {
  id: number
  name: string
  url: string
}

export default function SavedUrlsDialog() {
  const [urls, setUrls] = useState<CanvaTemplate[]>([])
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newName, setNewName] = useState("")
  const [newUrl, setNewUrl] = useState("")
  const [editName, setEditName] = useState("")
  const [editUrl, setEditUrl] = useState("")

  useEffect(() => {
    if (!open) return // Only fetch when dialog is opened

    async function getUrls() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('iract_canvaTemplates')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error("Error fetching URLs:", error)
        return
      }

      if (data) {
        setUrls(data)
      }
      setIsLoading(false)
    }

    getUrls()
  }, [open])

  const handleAddLink = async () => {
    if (!newName.trim() || !newUrl.trim()) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from('iract_canvaTemplates')
      .insert([
        { name: newName.trim(), url: newUrl.trim() }
      ])
      .select()

    if (error) {
      console.error("Error adding link:", error)
    } else if (data) {
      setUrls([...urls, ...data])
      setNewName("")
      setNewUrl("")
    }
    setIsLoading(false)
  }

  const handleEditLink = async (id: number) => {
    if (!editName.trim() || !editUrl.trim()) return

    setIsLoading(true)
    const { data, error } = await supabase
      .from('iract_canvaTemplates')
      .update({ name: editName.trim(), url: editUrl.trim() })
      .eq('id', id)
      .select()

    if (error) {
      console.error("Error updating link:", error)
    } else if (data) {
      setUrls(urls.map(url => url.id === id ? data[0] : url))
      setEditingId(null)
      setEditName("")
      setEditUrl("")
    }
    setIsLoading(false)
  }

  const handleDeleteLink = async (id: number) => {
    setIsLoading(true)
    const { error } = await supabase
      .from('iract_canvaTemplates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Error deleting link:", error)
    } else {
      setUrls(urls.filter(url => url.id !== id))
    }
    setIsLoading(false)
  }

  const startEdit = (template: CanvaTemplate) => {
    setEditingId(template.id)
    setEditName(template.name)
    setEditUrl(template.url)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditUrl("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <LayoutDashboard />
          Layouts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved Canva Templates</DialogTitle>
          <DialogDescription>
            Manage your saved templates. Add new links, edit existing ones, or remove templates you no longer need.
          </DialogDescription>
        </DialogHeader>

        {/* Add New Link Form */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-sm text-gray-700">Add New Template</h3>
          <div className="grid grid-cols-1 gap-3">
            <Input
              placeholder="Template name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isLoading}
            />
            <Input
              placeholder="Template URL..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              disabled={isLoading}
            />
            <Button
              onClick={handleAddLink}
              disabled={!newName.trim() || !newUrl.trim() || isLoading}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-3">
          {isLoading && urls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading templates...</div>
          ) : urls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No templates saved yet. Add your first template above!
            </div>
          ) : (
            urls.map((template) => (
              <div key={template.id} className="border rounded-lg p-4 space-y-2">
                {editingId === template.id ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Template name..."
                      disabled={isLoading}
                    />
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Template URL..."
                      disabled={isLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditLink(template.id)}
                        disabled={!editName.trim() || !editUrl.trim() || isLoading}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <a
                          href={template.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 break-all"
                        >
                          {template.url}
                        </a>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(template)}
                          disabled={isLoading}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteLink(template.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}