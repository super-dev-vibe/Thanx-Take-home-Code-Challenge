# frozen_string_literal: true

module Api
  class PointsController < ApplicationController
    def show
      user = User.find_by(id: params[:id])
      return render json: { errors: ["Not found"] }, status: :not_found unless user

      render json: { user_id: user.id, points_balance: user.points_balance }
    end

    def update
      user = User.find_by(id: params[:id])
      return render json: { errors: ["User not found"] }, status: :not_found unless user

      add = params[:points].to_s.to_i
      add = params[:points].to_i if params[:points].is_a?(Numeric)
      return render json: { errors: ["Missing or invalid points"] }, status: :bad_request unless add.positive?

      user.update!(points_balance: user.points_balance + add)
      render json: { user_id: user.id, points_balance: user.points_balance, added: add }
    end

  end
end
