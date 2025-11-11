package com.atb.campaignservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChannelTypeResponse {

    private String name;
    private String displayName;
    private String description;
    private List<String> configFields;
}

