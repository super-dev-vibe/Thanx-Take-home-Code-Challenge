# frozen_string_literal: true

Rails.application.routes.draw do
  namespace :api do
    get "users/:id/points", to: "points#show"
    post "users/:id/points", to: "points#update"
    post "topup", to: "topup#create"
    get "rewards", to: "rewards#index"
    get "users/:id/redemptions", to: "redemptions#index"
    post "users/:id/redemptions", to: "redemptions#create"
  end

  get "*path", to: "static#index", constraints: ->(req) { !req.path.start_with?("/api") }
  root "static#index"
end
