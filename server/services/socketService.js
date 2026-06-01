import { Server } from 'socket.io';

let io = null;

export const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    cors: {
      origin: clientUrl || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room based on user role (provided on connection)
    socket.on('join_role_room', (role) => {
      if (['super_admin', 'accountant', 'staff'].includes(role)) {
        socket.join(role);
        console.log(`Client ${socket.id} joined role room: ${role}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Send real-time notification
export const sendNotification = (notification) => {
  if (!io) {
    console.warn('Socket.io is not initialized yet.');
    return;
  }

  const { recipientRole } = notification;

  if (recipientRole === 'all') {
    io.emit('new_notification', notification);
  } else {
    io.to(recipientRole).emit('new_notification', notification);
  }
};
