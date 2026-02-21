# frozen_string_literal: true

module Api
  class TopupController < ApplicationController
    def create
      user_id = params[:user_id].to_s.to_i
      add = params[:points].to_s.to_i
      add = params[:points].to_i if params[:points].is_a?(Numeric) && params[:points]

      if user_id.zero? || !add.positive?
        return render json: { errors: ["Missing user_id or points"] }, status: :bad_request
      end

      user = User.find_by(id: user_id)
      return render json: { errors: ["User not found"] }, status: :not_found unless user

      user.update!(points_balance: user.points_balance + add)
      Rails.logger.info "[topup] user_id=#{user_id} added=#{add} balance=#{user.points_balance - add}->#{user.points_balance}"
      render json: { user_id: user.id, points_balance: user.points_balance, added: add }
    end
  end
end
