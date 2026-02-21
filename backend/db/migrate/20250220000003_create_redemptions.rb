# frozen_string_literal: true

class CreateRedemptions < ActiveRecord::Migration[7.2]
  def change
    create_table :redemptions do |t|
      t.references :user, null: false, foreign_key: true
      t.references :reward, null: false, foreign_key: true
      t.datetime :redeemed_at, null: false
      t.timestamps
    end
  end
end
