// SharedDSASheetDetail.tsx - Full Updated Code with PROPER LINK & DIFFICULTY
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Folder, BookOpen, Trash2, Edit3, RefreshCw,
    ChevronDown, ExternalLink, Search, Users, ArrowLeft, X, Link as LinkIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SharedItem {
    id: string;
    sheet_id: string;
    parent_id: string | null;
    name: string;
    type: 'folder' | 'problem';
    created_at: string;
    updated_at: string;
    children?: SharedItem[];
    problem?: {
        id: string;
        item_id: string;
        name: string;
        link: string;
        difficulty: 'easy' | 'medium' | 'hard';
    } | null;
}

interface SheetInfo {
    friend_name1: string;
    friend_name2: string;
    created_at: string;
}

export default function SharedDSASheetDetail() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { id: sheetId } = useParams<{ id: string }>();

    const [user, setUser] = useState<any>(null);
    const [sheetInfo, setSheetInfo] = useState<SheetInfo | null>(null);
    const [items, setItems] = useState<SharedItem[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<SharedItem | null>(null);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newItemType, setNewItemType] = useState<'folder' | 'problem'>('folder');
    const [newItemData, setNewItemData] = useState({
        name: '',
        parent_id: null as string | null,
        link: '',
        difficulty: 'easy' as 'easy' | 'medium' | 'hard',
        notes: ''
    });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Load sheet info + items
    // ✅ FIXED loadSheetData - Proper JOIN to get problem details
    // ✅ FIXED loadSheetData - Separate queries to get all data
    const loadSheetData = useCallback(async () => {
        if (!sheetId) return;

        setLoading(true);

        try {
            // Get sheet + friends
            const { data: rawSheetData, error: sheetError } = await supabase
                .from('shared_dsa_sheets')
                .select(`
        id,
        created_at,
        friends!friend_id(
          id,
          user_id_1,
          user_id_2
        )
      `)
                .eq('id', sheetId)
                .single();

            if (sheetError) {
                console.error('❌ Sheet error:', sheetError);
                toast({
                    title: "Error loading sheet",
                    description: sheetError.message,
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            const sheetData = rawSheetData as any;
            const friend = Array.isArray(sheetData?.friends) ? sheetData.friends[0] : sheetData?.friends;

            // Fetch profile names
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', [friend?.user_id_1, friend?.user_id_2]);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

            setSheetInfo({
                friend_name1: profileMap.get(friend?.user_id_1) || 'Unknown',
                friend_name2: profileMap.get(friend?.user_id_2) || 'Unknown',
                created_at: sheetData?.created_at
            });

            // ✅ STEP 1: Get all items for this sheet
            const { data: flatItems, error: itemsError } = await supabase
                .from('shared_dsa_items')
                .select('*')
                .eq('sheet_id', sheetId);

            console.log('📦 Flat items from DB:', flatItems);

            if (itemsError) {
                console.error('❌ Items error:', itemsError);
                toast({ title: "Error", description: itemsError.message, variant: "destructive" });
                setLoading(false);
                return;
            }

            // ✅ STEP 2: Get ALL problems for all items in this sheet
            const itemIds = (flatItems || []).map(item => item.id);
            let allProblems: any[] = [];

            if (itemIds.length > 0) {
                const { data: problems, error: problemsError } = await supabase
                    .from('shared_dsa_problems')
                    .select('*')
                    .in('item_id', itemIds);

                console.log('🔗 All problems from DB:', problems);

                if (problemsError) {
                    console.error('❌ Problems error:', problemsError);
                } else {
                    allProblems = problems || [];
                }
            }

            // ✅ STEP 3: Create problem map for quick lookup
            const problemMap = new Map<string, any>();
            allProblems.forEach(problem => {
                problemMap.set(problem.item_id, problem);
            });

            console.log('🗺️ Problem map:', problemMap);

            // ✅ STEP 4: Build items with problem data
            const rootItems: SharedItem[] = [];
            const itemMap = new Map<string, SharedItem>();

            (flatItems || []).forEach((raw: any) => {
                const problemData = problemMap.get(raw.id);

                console.log(`📝 Item "${raw.name}":`, problemData);

                const item: SharedItem = {
                    id: raw.id,
                    sheet_id: raw.sheet_id,
                    parent_id: raw.parent_id,
                    name: raw.name,
                    type: raw.type,
                    created_at: raw.created_at,
                    updated_at: raw.updated_at,
                    problem: problemData || null,
                    children: []
                };
                itemMap.set(raw.id, item);
            });

            // ✅ STEP 5: Build tree structure
            itemMap.forEach(item => {
                if (!item.parent_id) {
                    rootItems.push(item);
                } else {
                    const parent = itemMap.get(item.parent_id);
                    if (parent) {
                        parent.children ??= [];
                        parent.children.push(item);
                    }
                }
            });

            rootItems.forEach(item => {
                if (item.children && item.children.length > 0) {
                    item.children.sort((a, b) => a.name.localeCompare(b.name));
                }
            });

            console.log('✅ Final loaded items:', rootItems);
            setItems(rootItems);

            setLoading(false);
        } catch (err) {
            console.error('❌ Catch error:', err);
            setLoading(false);
        }
    }, [sheetId, toast]);



    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return navigate("/auth");
            setUser(session.user);
            if (sheetId) loadSheetData();
        };
        checkAuth();
    }, [navigate, sheetId, loadSheetData]);

    // Refresh on key change
    useEffect(() => {
        if (sheetId) loadSheetData();
    }, [refreshKey, sheetId, loadSheetData]);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        toast({ title: '🔄 Sheet refreshed!' });
    };

    // ✅ Toggle folder expansion
    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    // ✅ FIXED: Handle adding folder vs problem
    const openAddDialog = (type: 'folder' | 'problem', parentId?: string) => {
        setNewItemType(type);
        setNewItemData({
            name: '',
            parent_id: parentId || null,
            link: '',
            difficulty: 'easy',
            notes: ''
        });
        setEditingItem(null);
        setShowAddDialog(true);
    };

    const createItem = async () => {
        if (!sheetId || !newItemData.name.trim()) return;

        try {
            if (newItemType === 'folder') {
                // ✅ Create folder
                const { error } = await supabase
                    .from('shared_dsa_items')
                    .insert({
                        sheet_id: sheetId,
                        parent_id: newItemData.parent_id,
                        name: newItemData.name,
                        type: 'folder'
                    } as any);

                if (error) {
                    console.error('❌ Folder error:', error);
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                    return;
                }

                toast({ title: "✅ Folder created!" });
            } else {
                // ✅ Create problem
                console.log('📝 Creating problem:', newItemData);

                const { data: itemData, error: itemError } = await supabase
                    .from('shared_dsa_items')
                    .insert({
                        sheet_id: sheetId,
                        parent_id: newItemData.parent_id,
                        name: newItemData.name,
                        type: 'problem'
                    } as any)
                    .select()
                    .single();

                if (itemError) {
                    console.error('❌ Item error:', itemError);
                    toast({ title: "Error creating problem", description: itemError.message, variant: "destructive" });
                    return;
                }

                console.log('✅ Item created:', itemData);

                // Create problem details
                if (itemData?.id) {
                    const { error: problemError } = await supabase
                        .from('shared_dsa_problems')
                        .insert({
                            item_id: itemData.id,
                            name: newItemData.name,
                            link: newItemData.link,
                            difficulty: newItemData.difficulty
                        } as any);

                    if (problemError) {
                        console.error('❌ Problem details error:', problemError);
                        toast({ title: "Problem created but error saving details", description: problemError.message, variant: "destructive" });
                        return;
                    }

                    console.log('✅ Problem details saved');
                }

                toast({ title: "✅ Problem created!" });
            }

            setShowAddDialog(false);
            await loadSheetData();
            resetNewItem();
        } catch (error: any) {
            console.error('❌ Catch error:', error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const resetNewItem = () => {
        setNewItemData({ name: '', parent_id: null, link: '', difficulty: 'easy', notes: '' });
        setNewItemType('folder');
    };

    const deleteItem = async (itemId: string) => {
        try {
            console.log('🗑️ Deleting item:', itemId);

            const { error } = await supabase
                .from('shared_dsa_items')
                .delete()
                .eq('id', itemId);

            if (error) {
                console.error('❌ Delete error:', error);
                toast({ title: "Error", description: error.message, variant: "destructive" });
            } else {
                console.log('✅ Item deleted successfully');
                toast({ title: "✅ Item deleted!" });
                await loadSheetData();
            }
        } catch (error: any) {
            console.error('❌ Delete catch error:', error);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    if (loading || !sheetInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary/20 rounded-full animate-spin border-t-primary" />
                    Loading DSA sheet...
                </div>
            </div>
        );
    }

    // Count stats
    const totalProblems = items.reduce((count, item) => {
        return count + (item.type === 'problem' ? 1 : 0) + (item.children?.reduce((c, child) => c + (child.type === 'problem' ? 1 : 0), 0) || 0);
    }, 0);

    const folderCount = items.filter(item => item.type === 'folder').length;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => navigate(-1)}
                                className="h-10 w-10 p-0"
                                title="Go back"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                                    <Users className="w-4 h-4 text-primary-foreground" />
                                </div>
                                <div>
                                    <h1 className="font-bold text-lg">{sheetInfo.friend_name1} × {sheetInfo.friend_name2}</h1>
                                    <p className="text-sm text-muted-foreground">Shared DSA Sheet</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={handleRefresh}>
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </header>


            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Title Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-2">Shared DSA Sheet</h2>
                    <p className="text-muted-foreground">
                        {totalProblems} problems • {folderCount} folders
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-8">
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => openAddDialog('folder')}
                        className="flex items-center gap-2"
                    >
                        <Folder className="w-5 h-5" />
                        New Folder
                    </Button>
                    <Button
                        size="lg"
                        className="gradient-primary flex items-center gap-2"
                        onClick={() => openAddDialog('problem')}
                    >
                        <Plus className="w-5 h-5" />
                        Add Problem
                    </Button>
                </div>

                {/* Add/Edit Dialog */}
                {showAddDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <Card className="w-full max-w-2xl mx-4 shadow-xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>
                                    {newItemType === 'folder' ? 'Add New Folder' : 'Add Problem'}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                        setShowAddDialog(false);
                                        resetNewItem();
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {newItemType === 'folder' ? (
                                    // ✅ Folder Form
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Folder Name</label>
                                            <Input
                                                placeholder="e.g., Arrays, Strings, Trees"
                                                value={newItemData.name}
                                                onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                                                autoFocus
                                            />
                                        </div>
                                    </>
                                ) : (
                                    // ✅ Problem Form
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Problem Name</label>
                                            <Input
                                                placeholder="e.g., Two Sum"
                                                value={newItemData.name}
                                                onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Problem Link</label>
                                            <Input
                                                placeholder="https://leetcode.com/problems/..."
                                                value={newItemData.link}
                                                onChange={(e) => setNewItemData({ ...newItemData, link: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Difficulty</label>
                                            <Select
                                                value={newItemData.difficulty}
                                                onValueChange={(v) => setNewItemData({ ...newItemData, difficulty: v as any })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="easy">Easy</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="hard">Hard</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Select Folder (Optional)</label>
                                            <Select
                                                value={newItemData.parent_id || 'none'}
                                                onValueChange={(v) => setNewItemData({ ...newItemData, parent_id: v === 'none' ? null : v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a folder or leave empty" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Folder</SelectItem>
                                                    {items.filter(item => item.type === 'folder').map(folder => (
                                                        <SelectItem key={folder.id} value={folder.id}>
                                                            📁 {folder.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                                            <Textarea
                                                placeholder="Any notes or hints..."
                                                value={newItemData.notes}
                                                onChange={(e) => setNewItemData({ ...newItemData, notes: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddDialog(false);
                                            resetNewItem();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="gradient-primary"
                                        onClick={createItem}
                                        disabled={!newItemData.name.trim()}
                                    >
                                        {newItemType === 'folder' ? 'Create Folder' : 'Add Problem'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Items Card */}
                <Card className="shadow-card">
                    <CardContent className="p-6">
                        <ScrollArea className="h-[calc(100vh-350px)]">
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <FolderSection
                                        key={item.id}
                                        item={item}
                                        isExpanded={expandedFolders.has(item.id)}
                                        onToggle={() => toggleFolder(item.id)}
                                        onAddProblem={(parentId) => openAddDialog('problem', parentId)}
                                        onDelete={deleteItem}
                                    />
                                ))}
                                {items.length === 0 && (
                                    <div className="text-center py-16 text-muted-foreground">
                                        <Folder className="w-16 h-16 mx-auto mb-4 opacity-40" />
                                        <p className="text-xl font-medium mb-2">No folders or problems yet</p>
                                        <p className="text-muted-foreground mb-6">Get started by adding your first folder or problem</p>
                                        <div className="flex gap-3 justify-center">
                                            <Button
                                                variant="outline"
                                                onClick={() => openAddDialog('folder')}
                                            >
                                                New Folder
                                            </Button>
                                            <Button
                                                className="gradient-primary"
                                                onClick={() => openAddDialog('problem')}
                                            >
                                                Add Problem
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

// ✅ COLLAPSIBLE FolderSection Component
interface FolderSectionProps {
    item: SharedItem;
    isExpanded: boolean;
    onToggle: () => void;
    onAddProblem: (parentId: string) => void;
    onDelete: (id: string) => void;
}

function FolderSection({ item, isExpanded, onToggle, onAddProblem, onDelete }: FolderSectionProps) {
    const problemCount = item.children?.filter(c => c.type === 'problem').length || 0;

    return (
        <div className="space-y-3">
            {/* Folder Header - CLICKABLE TO TOGGLE */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <ChevronDown
                        className={`w-5 h-5 text-primary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                    <Folder className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-lg text-left">{item.name}</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{problemCount} problems</span>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onAddProblem(item.id)}
                            title="Add problem to this folder"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete folder?</AlertDialogTitle>
                                    <AlertDialogDescription>Delete "{item.name}" and all its problems permanently?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive" onClick={() => onDelete(item.id)}>
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </button>

            {/* Problems in Folder - ONLY SHOW WHEN EXPANDED */}
            {isExpanded && item.children && item.children.length > 0 && (
                <div className="space-y-2 ml-6 border-l border-border/50 pl-4">
                    {item.children.map(problem => (
                        <ProblemItem
                            key={problem.id}
                            item={problem}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ✅ UPDATED ProblemItem Component - WITH LINK, DIFFICULTY, AND ICONS
interface ProblemItemProps {
    item: SharedItem;
    onDelete: (id: string) => void;
}

function ProblemItem({ item, onDelete }: ProblemItemProps) {
    console.log('🔍 Rendering ProblemItem:', item.name, 'Link:', item.problem?.link);

    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-colors group">
            <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <BookOpen className="w-4 h-4 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
                {/* Problem Name + Difficulty Badge */}
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.name}</span>
                    {item.problem?.difficulty && (
                        <Badge
                            variant="outline"
                            className={`text-xs px-2.5 py-0.5 ${item.problem.difficulty === 'easy' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                                item.problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                                    'bg-red-500/10 text-red-500 border-red-500/30'
                                }`}
                        >
                            {item.problem.difficulty.toUpperCase()}
                        </Badge>
                    )}
                </div>

                {/* Problem Link - SHOW IF EXISTS */}
                {item.problem?.link && (
                    <p className="text-xs text-muted-foreground truncate mt-1 max-w-xs">
                        {item.problem.link}
                    </p>
                )}
            </div>

            {/* Action Buttons on Right */}
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {item.problem?.link && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title={`Open: ${item.problem.link}`}
                        onClick={() => window.open(item.problem?.link, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 text-primary" />
                    </Button>
                )}

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete problem?</AlertDialogTitle>
                            <AlertDialogDescription>Delete "{item.name}" permanently?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive" onClick={() => onDelete(item.id)}>
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

