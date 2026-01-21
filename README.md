# Daily Standup Picker

An application designed to randomly select the person responsible for leading the daily standup meeting. Streamline your team's morning routine with a simple, shared, and real-time interface.

## Features

- **Unique Team Rooms**: Create a team space under a unique, complex URL. The URL acts as the key to your room, ensuring security against brute-force attempts without the need for accounts or passwords.
- **No Login Required**: Access and collaboration are seamless. Anyone with the unique URL can join the room and manage the team.
- **Team Management**: Easily add and edit user nicknames. Modifications are open to anyone with access to the room link.
- **Availability Management**: Mark team members as "on vacation" or unavailable for the day to exclude them from the draw.
- **Smart History**: The system remembers who led the last meeting, ensuring they are not selected again immediately.
- **Real-Time Sync**: Leveraging WebSockets, everyone in the room sees the draw process and results live.
- **Persistent Storage**: All team data and history are securely saved in the backend.

## Technologies

- **Frontend**: [Angular](https://angular.io/) with [Taiga UI](https://taiga-ui.dev/) for a modern and responsive design.
- **Backend**: [Fastify](https://www.fastify.io/) handling the server logic and WebSockets for real-time communication.
- **Database**: [MariaDB](https://mariadb.org/) for persistent storage of team data and history.
- **Infrastructure**: Fully containerized with [Docker](https://www.docker.com/), including `Dockerfile` and `docker-compose.yml` for easy deployment.

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Installation

1. Clone the repository.
2. Run the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Go to `frontend` folder and run:
   ```bash
   npm start
   ```
4. Access the application in your browser.

### Usage

1. **Create a Team**: Generate a new team room with a unique URL.
2. **Add Members**: Enter the nicknames of your team members.
3. **Share the Link**: Copy the URL and share it with your team.
4. **Daily Draw**: Mark any absent members, then start the draw. The result is synchronized for everyone.
