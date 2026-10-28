# Odin Book Project Plan

## 0. Overview

This project is a simple text-based SNS similar to X or Threads.

## 1. Common Rules

- Unauthenticated users can only access the login and registration pages.
- Every profile and post is public to authenticated users.

## 2. Functional Requirements

### 2.1 Authentication

- Users can
  - **create** accounts with email
  - **create** accounts with social media accounts
  - **connect** social media accounts
  - **log in** with email and password
  - **log in** with social media accounts
  - **log in** with connected social media accounts
  - **log out**
  - **disconnect** social media accounts
  - **deactivate** their accounts
  - **reactivate** their accounts

```plantuml
@startuml
left to right direction

actor Guest
actor "Authenticated User" as Member

rectangle Authentication {
  usecase Register
  usecase Login

  Guest --> Register
  Register <|-- (Email Registration)
  Register <|-- (Social Registration)

  Guest --> Login
  Login <|-- (Email Login)
  Login <|-- (Social Login)
  Login <. (Reactivate Account) : <<extend>>

  Member --> (Connect Social Accounts)
  Member --> (Disconnect Social Accounts)
  Member --> (Logout)
  Member --> (Deactivate Account)
}

@enduml
```

### 2.2 Profile

- Users can
  - **view** their profiles.
  - **view** other users' profiles.
  - **edit** their profiles

```plantuml
@startuml
left to right direction

actor "Authenticated User" as Member

rectangle Profile {
  usecase "View Profile" as ViewProfile
  usecase "Edit Profile" as UpdateProfile

  ViewProfile <|-- (View My Profile)
  ViewProfile <|-- (View Other Users' Profiles)
}

Member --> ViewProfile
Member --> UpdateProfile

@enduml
```

### 2.3 User Discovery

- Users can
  - **view** all users.
  - **search for** users.

```plantuml
@startuml
left to right direction

actor "Authenticated User" as Member

rectangle "User Discovery" {
  usecase "View All Users" as ViewAllUsers
  usecase "Search For Users" as SearchUsers
}

Member --> ViewAllUsers
Member --> SearchUsers

@enduml
```

### 2.4 Follow

- Users can
  - **send** follow requests to other users.
  - **view** their sent follow requests.
  - **cancel** their sent follow requests.
  - **view** received follow requests.
  - **accept** received follow requests.
  - **reject** received follow requests.
  - **unfollow** other users.

```plantuml
@startuml
left to right direction

actor "Authenticated User" as Member

rectangle Follow {
  package "Outgoing" {
    usecase "Send Request" as Send
    usecase "View Sent Requests" as ViewSent
    usecase "Cancel Request" as Cancel
  }

  package "Incoming" {
    usecase "View Received Requests" as ViewReceived
    usecase "Accept Request" as Accept
    usecase "Reject Request" as Reject
  }

  usecase "Unfollow User" as Unfollow
}

Member --> Send
Member --> ViewSent
Member --> Cancel
Member --> ViewReceived
Member --> Accept
Member --> Reject
Member --> Unfollow

@enduml
```

### 2.5 Post

- Users can
  - **create** posts.
  - **view** posts.
  - **view** home feed.
  - **edit** their posts.
  - **delete** their posts.

```plantuml
@startuml
left to right direction

actor "Authenticated User" as Member

rectangle Post {
  Member --> (Create Posts)
  Member --> (View Posts)
  (View Posts) <|-- (View Home Feed)
  Member --> (Edit Posts)
  Member --> (Delete Posts)
}

@enduml
```

### 2.6 Like

- Users can
  - **give** likes on posts.
  - **cancel** likes on posts.

```plantuml
@startuml
left to right direction

actor "Authenticated User" as Member

rectangle Like {
  Member --> (Give Likes on Posts)
  Member --> (Cancel Likes on Posts)
}
@enduml
```

### 2.7 Comment

- Users can
  - **leave** comments on posts.
  - **view** comments of each post.
  - **edit** their comments.
  - **delete** their comments.

```plantuml
@startuml
left to right direction

actor "Authenticated User" as Member

rectangle Comment {
  Member --> (Leave Comments on Posts)
  Member --> (View Comments on Posts)
  Member --> (Edit Their Comments)
  Member --> (Delete Their Comments)
}
@enduml
```

## 3 Business Rules

### 3.1 Authentication

- Email addresses must be unique.
- Passwords must be between 15 and 128 characters long.
- Passwords can contain any characters, including spaces.
- Users can arrange multiple social media accounts to be logged in.
- Authenticated users can manage social media accounts access.
- There must be at least one login method.

### 3.2 Profile

- The first registration with a social media retrieves display name and profile image from the service.
- If a social media doesn't provide data, use default value.
- User can confirm and edit the retrived data to complete registration.
- Profile ID is generated automatically.
-

```

```
