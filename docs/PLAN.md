# Odin Book Project Plan

## 0. Overview

This project is a simple text-based SNS similar to X or Threads.

## 1. Common Rules

- Unauthenticated users can only access the login and registration pages.
- Every profile and post is public to authenticated users

## 2. Functional Requirements

### 2.1 Authentication

- Users can create accounts
- Users can log in with email and password
- Users can log in with X, Threads or Instagram accounts
- Users can log out
- Users can delete(deactive) their accounts
- A default profile is created when a user creates an account

### 2.2 Profile

- Users can view their profiles
- Users can view other users' profiles
- Profile contains:
  - Display Name, profile ID, profile image and bio
  - User's posts
  - Following and Follower counts and their lists
- Users can edit their profile details:
  - Display Name, profile ID, profile image and bio
- Other users' profiles display their follow status relative to the current user

### 2.3 User Discovery

- Users can view a list of all users
- Users can search for other users by their display name or profile ID
- Searched user results provide links to their profiles
- Users can send follow requests from the user list

### 2.4 Follow

- Users can send follow requests to other users
- Users can view their sent follow requests
- Users can cancel their sent follow requests
- Users can view received follow requests
- Users can accept received follow requests
- Users can reject received follow requests
- Users can unfollow other users

### 2.5 Post

- Users can create text posts up to 500 characters
- Users can view posts
- Posts display:
  - Text content, author, likes and comments
- Users can edit their post text
- Users can delete their posts

### 2.6 Feed

- The home feed displays posts from the current user and users they follow.
- Posts are displayed in reverse chronological order

### 2.7 Like

- Users can give likes on posts
- Users can view likes counts of each posts
- Users can cancel likes on liked posts

### 2.8 Comment

- Users can leave comments on posts
- Users can view comments of each post
- Users can edit their comments
- Users can delete their comments
