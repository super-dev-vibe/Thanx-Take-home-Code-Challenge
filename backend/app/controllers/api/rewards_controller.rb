# frozen_string_literal: true

module Api
  class RewardsController < ApplicationController
    def index
      rewards = Reward.order(:points_cost).map do |r|
        { id: r.id, name: r.name, points_cost: r.points_cost, description: r.description }
      end
      render json: rewards
    end
  end
end
