# frozen_string_literal: true

class Reward < ApplicationRecord
  has_many :redemptions, dependent: :nullify
end
