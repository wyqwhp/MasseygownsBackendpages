import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Trash2, Key } from "lucide-react";
import AdminNavbar from "./AdminNavbar.jsx";
import axios from "axios";
import FullscreenSpinner from "@/components/FullscreenSpinner.jsx";

const API_URL = import.meta.env.VITE_GOWN_API_BASE; // or hardcode "http://localhost:5144"

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/admin/users`)
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const validatePassword = (password) => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialChar,
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    };
  };

  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordRepeat, setNewPasswordRepeat] = useState("");
  const [changePasswordId, setChangePasswordId] = useState(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const toggleUserActive = async (userId, newValue) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/active`, {
        active: newValue,
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: newValue } : u))
      );
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (userId) => {
    setSelectedUserId(userId);
    setDeleteDialogOpen(true);
  };

  const handleCreateUser = async () => {
    if (newUsername && newEmail && newPassword) {
      const newUser = {
        name: newUsername,
        email: newEmail,
        passwordHash: newPassword,
      };

      setLoading(true);
      try {
        let res = await axios.post(`${API_URL}/admin/users`, newUser);
        newUser.id = res.data.id;
      } catch (err) {
        setError("Add new user failed: " + err.message);
      } finally {
        setLoading(false);
      }

      setUsers([...users, newUser]);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewPasswordRepeat("");
      setCreateDialogOpen(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (err) {
      setError("Update failed: " + err.message);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const passwordValidation = validatePassword(passwordValue);
    setLoading(true);
    const newPassword = {
      Password: passwordValue,
    };
    try {
      await axios.put(
        `${API_URL}/api/users/${changePasswordId}/change-password`,
        newPassword
      );
    } catch (err) {
      setError("Update failed: " + err.message);
    } finally {
      setLoading(false);
    }
    if (
      passwordValue &&
      passwordValue === passwordRepeat &&
      passwordValidation.isValid
    ) {
      alert(`Password changed for user ID: ${changePasswordId}`);
      setPasswordValue("");
      setPasswordRepeat("");
      setChangePasswordId(null);
      setPasswordDialogOpen(false);
    }
  };

  const openPasswordDialog = (userId) => {
    setChangePasswordId(userId);
    setPasswordDialogOpen(true);
  };

  if (loading) return <FullscreenSpinner />;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-gray-50 p-8 topform">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2 bg-green-700 hover:bg-green-800">
                  <UserPlus className="w-4 h-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter password"
                    />
                    {newPassword &&
                      (() => {
                        const validation = validatePassword(newPassword);
                        return (
                          <div className="text-xs space-y-1 mt-2">
                            <p
                              className={
                                validation.minLength
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {validation.minLength ? "✓" : "✗"} At least 8
                              characters
                            </p>
                            <p
                              className={
                                validation.hasUpperCase
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {validation.hasUpperCase ? "✓" : "✗"} One
                              uppercase letter
                            </p>
                            <p
                              className={
                                validation.hasLowerCase
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {validation.hasLowerCase ? "✓" : "✗"} One
                              lowercase letter
                            </p>
                            <p
                              className={
                                validation.hasNumber
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {validation.hasNumber ? "✓" : "✗"} One number
                            </p>
                            <p
                              className={
                                validation.hasSpecialChar
                                  ? "text-green-600"
                                  : "text-red-500"
                              }
                            >
                              {validation.hasSpecialChar ? "✓" : "✗"} One
                              special character (!@#$%^&*...)
                            </p>
                          </div>
                        );
                      })()}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-repeat">Repeat Password</Label>
                    <Input
                      id="password-repeat"
                      type="password"
                      value={newPasswordRepeat}
                      onChange={(e) => setNewPasswordRepeat(e.target.value)}
                      placeholder="Repeat password"
                    />
                    {newPassword &&
                      newPasswordRepeat &&
                      newPassword !== newPasswordRepeat && (
                        <p className="text-sm text-red-500">
                          Passwords do not match
                        </p>
                      )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    className="bg-green-700 hover:bg-green-800"
                    disabled={
                      !newUsername ||
                      !newEmail ||
                      !newPassword ||
                      newPassword !== newPasswordRepeat ||
                      !validatePassword(newPassword).isValid
                    }
                  >
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="grid grid-cols-[80px_200px_40px_100px] gap-4 py-1 items-center">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="font-small text-gray-500">{user.email}</p>
                      <Label htmlFor="active">Active</Label>
                      <Switch
                        checked={user.active}
                        onCheckedChange={(checked) =>
                          toggleUserActive(user.id, checked)
                        }
                        className="
                                          data-[state=checked]:bg-green-700
                                          data-[state=unchecked]:bg-gray-400"
                        disabled={user.name === "user"}
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPasswordDialog(user.id)}
                        className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white hover:text-white"
                      >
                        <Key className="w-4 h-4" />
                        Change Password
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(user.id)}
                        disabled={user.name === "user"}
                        className="flex items-center gap-2 hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  No
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDeleteUser(selectedUserId)}
                >
                  Yes, Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter a new password for this user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    placeholder="Enter new password"
                  />
                  {passwordValue &&
                    (() => {
                      const validation = validatePassword(passwordValue);
                      return (
                        <div className="text-xs space-y-1 mt-2">
                          <p
                            className={
                              validation.minLength
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {validation.minLength ? "✓" : "✗"} At least 8
                            characters
                          </p>
                          <p
                            className={
                              validation.hasUpperCase
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {validation.hasUpperCase ? "✓" : "✗"} One uppercase
                            letter
                          </p>
                          <p
                            className={
                              validation.hasLowerCase
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {validation.hasLowerCase ? "✓" : "✗"} One lowercase
                            letter
                          </p>
                          <p
                            className={
                              validation.hasNumber
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {validation.hasNumber ? "✓" : "✗"} One number
                          </p>
                          <p
                            className={
                              validation.hasSpecialChar
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {validation.hasSpecialChar ? "✓" : "✗"} One special
                            character (!@#$%^&*...)
                          </p>
                        </div>
                      );
                    })()}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    value={passwordRepeat}
                    onChange={(e) => setPasswordRepeat(e.target.value)}
                    placeholder="Repeat new password"
                  />
                  {passwordValue &&
                    passwordRepeat &&
                    passwordValue !== passwordRepeat && (
                      <p className="text-sm text-red-500">
                        Passwords do not match
                      </p>
                    )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPasswordDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-700 hover:bg-green-800"
                  onClick={handleChangePassword}
                  disabled={
                    !passwordValue ||
                    passwordValue !== passwordRepeat ||
                    !validatePassword(passwordValue).isValid
                  }
                >
                  Change Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
