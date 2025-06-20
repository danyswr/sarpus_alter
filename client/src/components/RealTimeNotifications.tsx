import { useState, useEffect } from "react";
import { wsClient } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle, X, UserPlus, UserMinus, Heart, MessageSquare, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    // Handle real-time events
    const handleNewPost = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'new_post',
        message: data.message,
        timestamp: data.timestamp,
        read: false,
        data
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      
      toast({
        title: "Post Baru",
        description: data.message,
        duration: 3000,
      });
    };

    const handlePostUpdated = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'post_updated',
        message: data.message,
        timestamp: data.timestamp,
        read: false,
        data
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      
      toast({
        title: "Post Diperbarui",
        description: data.message,
        duration: 3000,
      });
    };

    const handlePostDeleted = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'post_deleted',
        message: data.message,
        timestamp: data.timestamp,
        read: false,
        data
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      
      toast({
        title: "Post Dihapus",
        description: data.message,
        duration: 3000,
      });
    };

    const handlePostInteraction = (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: 'post_interaction',
        message: data.message,
        timestamp: data.timestamp,
        read: false,
        data
      };
      
      setNotifications(prev => [notification, ...prev.slice(0, 49)]);
      
      toast({
        title: data.interactionType === 'like' ? "Postingan Disukai" : "Postingan Tidak Disukai",
        description: data.message,
        duration: 2000,
      });
    };

    const handleUserOnline = (data: any) => {
      setOnlineUsers(prev => {
        const users = new Set(prev);
        users.add(data.username);
        return users;
      });
      
      toast({
        title: "User Online",
        description: `${data.username} sedang online`,
        duration: 2000,
      });
    };

    const handleUserOffline = (data: any) => {
      setOnlineUsers(prev => {
        const users = new Set(prev);
        users.delete(data.username);
        return users;
      });
      
      toast({
        title: "User Offline",
        description: `${data.username} sudah offline`,
        duration: 2000,
      });
    };

    // Register event handlers
    wsClient.on('new_post', handleNewPost);
    wsClient.on('post_updated', handlePostUpdated);
    wsClient.on('post_deleted', handlePostDeleted);
    wsClient.on('post_interaction', handlePostInteraction);
    wsClient.on('user_online', handleUserOnline);
    wsClient.on('user_offline', handleUserOffline);

    return () => {
      // Cleanup event handlers
      wsClient.off('new_post', handleNewPost);
      wsClient.off('post_updated', handlePostUpdated);
      wsClient.off('post_deleted', handlePostDeleted);
      wsClient.off('post_interaction', handlePostInteraction);
      wsClient.off('user_online', handleUserOnline);
      wsClient.off('user_offline', handleUserOffline);
    };
  }, [toast]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_post':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'post_updated':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'post_deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'post_interaction':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'user_online':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'user_offline':
        return <UserMinus className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Online Users Indicator */}
      {onlineUsers.size > 0 && (
        <div className="absolute -bottom-8 left-0 text-xs text-green-600 whitespace-nowrap">
          {onlineUsers.size} users online
        </div>
      )}

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 max-h-96 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-semibold">Real-time Updates</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Belum ada notifikasi
              </div>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`m-2 cursor-pointer transition-colors ${
                    notification.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          
          {/* WebSocket Status */}
          <div className="border-t p-2 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span>Real-time Status:</span>
              <span className={`flex items-center gap-1 ${
                wsClient.isConnected() ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  wsClient.isConnected() ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {wsClient.isConnected() ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}