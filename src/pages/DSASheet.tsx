import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Code2, BookOpen, Plus, ExternalLink, LogOut, CheckCircle2, Circle, Trash2, Folder,
  ChevronDown, Edit3, Loader2, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface Folder {
  id: string;
  name: string;
  problem_count: number;
  open: boolean;
  problems: Problem[];
}


interface Problem {
  id: string;
  name: string;
  link: string;
  folder_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  note?: string;
  solved: boolean;
}


export default function DSASheet() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);


  // Dialog states
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: string, name: string } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);


  // Form states
  const [folderName, setFolderName] = useState("");
  const [problemName, setProblemName] = useState("");
  const [problemLink, setProblemLink] = useState("");
  const [problemDifficulty, setProblemDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [problemNote, setProblemNote] = useState("");


  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        navigate("/auth");
        return;
      }


      console.log("✅ User ID:", session.user.id);
      setUserId(session.user.id);
      
      await loadAllDataWithRetry();
      
    } catch (error) {
      console.error("Initial load failed:", error);
      toast({ title: "Auth Error", description: "Please login again", variant: "destructive" });
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };


  // ✅ FIXED: NO user_id in dsa_problems table - only folder_id relationship
  const loadAllDataWithRetry = async (retryCount = 0) => {
    if (!userId) return;


    try {
      setIsLoadingData(true);
      console.log("🔄 Loading folders...");
      
      // STEP 1: Load folders ✅ (this works)
      const { data: foldersData, error: foldersError } = await supabase
        .from('dsa_folders')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });


      if (foldersError) throw new Error(`Folders error: ${foldersError.message}`);
      
      console.log("✅ Folders loaded:", foldersData?.length || 0);


      if (!foldersData?.length) {
        setFolders([]);
        setIsLoadingData(false);
        return;
      }


      // STEP 2: Load problems ✅ FIXED - NO user_id filter
      console.log("🔄 Loading problems...");
      const folderIds = foldersData.map(f => f.id);
      
      const { data: problemsData, error: problemsError } = await supabase
        .from('dsa_problems')
        .select('id, name, link, folder_id, difficulty, note, solved')
        .in('folder_id', folderIds);


      if (problemsError) {
        console.error("Problems error:", problemsError);
        throw new Error(`Problems error: ${problemsError.message}`);
      }
      
      console.log("✅ Problems loaded:", problemsData?.length || 0);


      // STEP 3: Group problems by folder
      const foldersWithProblems: Folder[] = foldersData.map(folder => {
        const folderProblems = problemsData?.filter(p => p.folder_id === folder.id) || [];
        return {
          id: folder.id,
          name: folder.name,
          problem_count: folderProblems.length,
          open: false,
          problems: folderProblems as Problem[]
        };
      });


      setFolders(foldersWithProblems);
      console.log("✅ All data loaded!");


      if (foldersWithProblems[0]) {
        setTimeout(() => toggleFolder(foldersWithProblems[0].id), 200);
      }


    } catch (error: any) {
      console.error("❌ Load error:", error);
      if (retryCount < 2) {
        setTimeout(() => loadAllDataWithRetry(retryCount + 1), 1500);
      }
    } finally {
      setIsLoadingData(false);
    }
  };


  const toggleFolder = (folderId: string) => {
    setFolders(prev => prev.map(folder => 
      folder.id === folderId ? { ...folder, open: !folder.open } : folder
    ));
  };


  const refreshData = async () => {
    if (userId) await loadAllDataWithRetry();
  };


  const addFolder = async () => {
    if (!folderName.trim() || !userId) return;


    try {
      const { data, error } = await supabase
        .from('dsa_folders')
        .insert({ user_id: userId, name: folderName.trim() })
        .select('id, name')
        .single();


      if (error) throw error;


      toast({ title: "Folder created!", description: folderName });
      
      const newFolder: Folder = {
        id: data.id,
        name: data.name,
        problem_count: 0,
        open: true,
        problems: []
      };
      
      setFolders(prev => [newFolder, ...prev]);
      setFolderName("");
      setShowFolderDialog(false);


    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const updateFolder = async () => {
    if (!editingFolder || !folderName.trim()) return;


    try {
      const { error } = await supabase
        .from('dsa_folders')
        .update({ name: folderName.trim() })
        .eq('id', editingFolder.id)
        .eq('user_id', userId);


      if (error) throw error;


      toast({ title: "Folder updated!" });
      setFolders(prev => prev.map(folder => 
        folder.id === editingFolder.id ? { ...folder, name: folderName.trim() } : folder
      ));
      setFolderName("");
      setEditingFolder(null);
      setShowFolderDialog(false);


    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const deleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder || folder.problem_count > 0) {
      toast({ title: "Cannot delete", description: "Delete problems first", variant: "destructive" });
      return;
    }


    try {
      const { error } = await supabase
        .from('dsa_folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', userId);


      if (error) throw error;


      toast({ title: "Folder deleted!" });
      setFolders(prev => prev.filter(f => f.id !== folderId));


    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  // ✅ FIXED: NO user_id in updates/deletes - only id or folder_id
  const addProblem = async () => {
    if (!problemName.trim() || !problemLink.trim() || !selectedFolderId) return;


    try {
      const { data: newProblem, error } = await supabase
        .from('dsa_problems')
        .insert({
          folder_id: selectedFolderId,
          name: problemName.trim(),
          link: problemLink.trim(),
          difficulty: problemDifficulty,
          note: problemNote.trim() || null,
          solved: false
        })
        .select()
        .single();


      if (error) throw error;


      toast({ title: "Problem added!", description: problemName });
      
      setFolders(prev => prev.map(folder => {
        if (folder.id === selectedFolderId) {
          return {
            ...folder,
            problem_count: folder.problem_count + 1,
            problems: [...folder.problems, newProblem as Problem]
          };
        }
        return folder;
      }));
      
      setProblemName("");
      setProblemLink("");
      setProblemDifficulty('easy');
      setProblemNote("");
      setShowProblemDialog(false);
      setSelectedFolderId(null);


    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const toggleSolved = async (problemId: string) => {
    try {
      const folder = folders.find(f => f.problems.some(p => p.id === problemId));
      if (!folder) return;


      const problem = folder.problems.find(p => p.id === problemId);
      if (!problem) return;


      const newSolvedState = !problem.solved;
      
      // ✅ FIXED: Only use problem.id - NO user_id
      const { error } = await supabase
        .from('dsa_problems')
        .update({ solved: newSolvedState })
        .eq('id', problemId);


      if (error) throw error;


      setFolders(prev => prev.map(f => {
        if (f.id === folder.id) {
          return {
            ...f,
            problems: f.problems.map(p =>
              p.id === problemId ? { ...p, solved: newSolvedState } : p
            )
          };
        }
        return f;
      }));


    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const deleteProblem = async (problemId: string) => {
    try {
      const folder = folders.find(f => f.problems.some(p => p.id === problemId));
      if (!folder) return;


      // ✅ FIXED: Only use problem.id - NO user_id
      const { error } = await supabase
        .from('dsa_problems')
        .delete()
        .eq('id', problemId);


      if (error) throw error;


      toast({ title: "Problem deleted!" });
      setFolders(prev => prev.map(f => {
        if (f.id === folder.id) {
          return {
            ...f,
            problem_count: f.problem_count - 1,
            problems: f.problems.filter(p => p.id !== problemId)
          };
        }
        return f;
      }));


    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };


  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-primary" />
          <p className="text-xl font-semibold mb-2">Loading DSA Sheet...</p>
        </div>
      </div>
    );
  }


  const totalProblems = folders.reduce((sum, f) => sum + f.problem_count, 0);
  const totalSolved = folders.reduce((sum, f) => sum + f.problems.filter(p => p.solved).length, 0);
  const progress = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;


  return (
    <div className="min-h-screen bg-background">
      {/* ✅ FIXED: Added navigation header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <img
                src="/logo.png"
                alt="DSA Socio"
                className="w-full h-full object-cover rounded-xl drop-shadow-lg"
              />
              </div>
              <span className="text-xl font-bold">DSA Socio</span>
            </Link>

            {/* ✅ ADDED NAVIGATION MENU */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link to="/discover" className="text-muted-foreground hover:text-foreground transition-colors">
                Discover
              </Link>
              <Link to="/dsa-sheet" className="text-foreground font-medium">
                DSA Sheet
              </Link>
              <Link to="/shared-dsa-sheet" className="text-muted-foreground hover:text-foreground transition-colors">
                Shared Sheets
              </Link>
              <Link to="/messages" className="text-muted-foreground hover:text-foreground transition-colors">
                Messages
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoadingData || !userId}>
                {isLoadingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              My DSA Sheet
            </h1>
            <p className="text-muted-foreground text-lg">
              {totalProblems} problems • {totalSolved} solved • {progress}%
            </p>
          </div>


          {/* ✅ BOTH BUTTONS SIDE BY SIDE */}
          <div className="flex gap-3">
            <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="lg" className="shadow-lg">
                  <Folder className="w-5 h-5 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingFolder ? "Edit Folder" : "Create Folder"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="folderName">Folder Name</Label>
                    <Input
                      id="folderName"
                      placeholder="e.g., Arrays, Trees, Graphs"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="gradient"
                      onClick={editingFolder ? updateFolder : addFolder}
                      disabled={!folderName.trim()}
                    >
                      {editingFolder ? "Update" : "Create"}
                    </Button>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                  </div>
                </div>
              </DialogContent>
            </Dialog>


            <Dialog open={showProblemDialog} onOpenChange={setShowProblemDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Problem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Problem</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="problemName">Problem Name</Label>
                      <Input
                        id="problemName"
                        placeholder="e.g., Two Sum"
                        value={problemName}
                        onChange={(e) => setProblemName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="problemLink">Problem Link</Label>
                      <Input
                        id="problemLink"
                        placeholder="https://leetcode.com/problems/..."
                        value={problemLink}
                        onChange={(e) => setProblemLink(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="problemDifficulty">Difficulty</Label>
                      <Select value={problemDifficulty} onValueChange={(value: any) => setProblemDifficulty(value)}>
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
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="problemNote">Notes (Optional)</Label>
                      <Textarea
                        id="problemNote"
                        placeholder="Any notes or hints..."
                        value={problemNote}
                        onChange={(e) => setProblemNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 items-end">
                    <Select value={selectedFolderId || ""} onValueChange={setSelectedFolderId as any}>
                      <SelectTrigger className="w-full md:w-96">
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {folders.map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>
                            📁 {folder.name} ({folder.problem_count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        className="flex-1"
                        variant="gradient"
                        onClick={addProblem}
                        disabled={!selectedFolderId || !problemName.trim() || !problemLink.trim()}
                      >
                        Add Problem
                      </Button>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>


        {/* Progress Card + Folders content same as before */}
        <Card className="mb-8 shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <p className="text-muted-foreground text-lg mb-2">Overall Progress</p>
                <p className="text-3xl font-bold">{totalSolved} / {totalProblems} Solved</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black text-gradient">{progress}%</p>
                <p className="text-sm text-muted-foreground font-medium">Complete</p>
              </div>
            </div>
            <div className="mt-6 h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>


        <div className="space-y-6">
          {folders.length === 0 ? (
            <Card className="text-center py-16 text-muted-foreground">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No folders yet</h3>
              <p className="mb-6">Create your first folder to organize problems</p>
              <Button variant="gradient" onClick={() => setShowFolderDialog(true)} className="shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Create First Folder
              </Button>
            </Card>
          ) : (
            folders.map((folder) => (
              <Card key={folder.id} className="shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                      <div className={`w-5 h-5 rounded transition-all ${folder.open ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Folder className="w-6 h-6 text-primary" />
                        <h3 className="font-bold text-lg">{folder.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {folder.problem_count} problems
                      </Badge>
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder({ id: folder.id, name: folder.name });
                        setFolderName(folder.name);
                        setShowFolderDialog(true);
                      }}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} disabled={folder.problem_count > 0}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={folder.open ? "pb-6" : "pb-0"}>
                  {folder.open && (
                    <div className="space-y-3">
                      {folder.problems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <p className="text-sm">No problems in this folder</p>
                          <p className="text-xs mt-1 opacity-75">Add your first problem!</p>
                        </div>
                      ) : (
                        folder.problems.map((problem) => (
                          <div key={problem.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 group hover:shadow-md ${
                            problem.solved ? "bg-success/10 border-success/30" : "bg-background border-border hover:border-primary/30"
                          }`}>
                            <div className="flex items-center gap-4 flex-1">
                              <button onClick={(e) => { e.stopPropagation(); toggleSolved(problem.id); }} 
                                className="flex-shrink-0 p-2 rounded-lg hover:bg-accent transition-colors">
                                {problem.solved ? (
                                  <CheckCircle2 className="w-5 h-5 text-success" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${problem.solved ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                  {problem.name}
                                </p>
                                {problem.note && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{problem.note}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                              <Badge variant="outline" className={`text-xs px-2 py-1 capitalize ${problem.solved ? 'bg-success text-success-foreground' : ''}`}>
                                {problem.difficulty}
                              </Badge>
                              <a href={problem.link} target="_blank" rel="noopener noreferrer" 
                                className="p-2 hover:bg-accent rounded-lg transition-all group-hover:scale-105">
                                <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                              </a>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1.5 h-auto w-auto"
                                onClick={(e) => { e.stopPropagation(); deleteProblem(problem.id); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
