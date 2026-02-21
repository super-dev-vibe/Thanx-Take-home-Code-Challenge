# frozen_string_literal: true

module Api
  class RedemptionsController < ApplicationController
    def index
      user = User.find_by(id: params[:id])
      return render json: { errors: ["Not found"] }, status: :not_found unless user

      list = user.redemptions.joins(:reward).order(redeemed_at: :desc).map do |r|
        {
          id: r.id,
          reward_id: r.reward_id,
          reward_name: r.reward.name,
          points_cost: r.reward.points_cost,
          redeemed_at: r.redeemed_at.iso8601(3)
        }
      end
      render json: list
    end

    def create
      user = User.find_by(id: params[:id])
      return render json: { errors: ["Not found"] }, status: :not_found unless user

      reward_id = params.dig(:redemption, :reward_id)&.to_i
      return render json: { errors: ["Missing reward_id"] }, status: :bad_request unless reward_id&.positive?

      reward = Reward.find_by(id: reward_id)
      return render json: { errors: ["Not found"] }, status: :not_found unless reward

      if user.points_balance < reward.points_cost
        return render json: { errors: ["Insufficient points"] }, status: :unprocessable_entity
      end

      now = Time.current.utc
      redemption = user.redemptions.create!(
        reward: reward,
        redeemed_at: now
      )
      user.update!(points_balance: user.points_balance - reward.points_cost)

      render json: {
        id: redemption.id,
        reward_name: reward.name,
        points_cost: reward.points_cost,
        redeemed_at: now.iso8601(3),
        new_balance: user.reload.points_balance
      }, status: :created
    end
  end
end
